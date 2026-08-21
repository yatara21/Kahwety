from __future__ import annotations

import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import PaymentStatus, SubscriptionStatus, UserRole
from app.core.config import settings
from app.core.exceptions import BusinessException, ForbiddenException, NotFoundException, UnauthorizedException
from app.core.logging import logger
from app.modules.payments.models import Payment
from app.modules.payments.repository import PaymentRepository
from app.modules.subscription_plans.repository import SubscriptionPlanRepository
from app.modules.subscriptions.repository import SubscriptionRepository
from app.services.moyasar_service import MoyasarService, get_moyasar_service


class PaymentService:
    def __init__(self, session: AsyncSession, moyasar: Optional[MoyasarService] = None):
        self.session = session
        self.payment_repository = PaymentRepository(session)
        self.subscription_repository = SubscriptionRepository(session)
        self.plan_repository = SubscriptionPlanRepository(session)
        self._moyasar = moyasar

    @property
    def moyasar(self) -> MoyasarService:
        if self._moyasar is None:
            self._moyasar = get_moyasar_service()
        return self._moyasar

    async def create_subscription_checkout(self, *, user, plan_id: str) -> dict[str, str]:
        if user.role not in (UserRole.CUSTOMER, UserRole.CAFE_OWNER):
            raise ForbiddenException("Only customers and cafe owners can subscribe")

        plan = await self.plan_repository.get_by_id(plan_id)
        if not plan or not plan.is_active:
            raise NotFoundException("Subscription plan not found")

        if plan.subscriber_type.value != user.role.value:
            raise BusinessException(
                f"Plan is for {plan.subscriber_type.value}, current user is {user.role.value}"
            )

        active = await self.subscription_repository.get_active_by_user(user.id)
        if active:
            raise BusinessException("User already has an active subscription")

        subscription = await self.subscription_repository.create(
            user_id=user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.PENDING,
        )

        metadata = {
            "user_id": str(user.id),
            "subscription_id": str(subscription.id),
            "plan_id": str(plan.id),
        }

        payment = await self.payment_repository.create(
            user_id=user.id,
            subscription_id=subscription.id,
            amount=float(plan.price),
            currency=plan.currency or "SAR",
            status=PaymentStatus.PENDING,
            metadata=metadata,
        )

        moyasar_result = await self.moyasar.create_payment(
            amount=plan.price,
            currency=plan.currency or "SAR",
            description=f"Subscription: {plan.name}",
            metadata=metadata,
        )

        payment_url = moyasar_result.get("url")
        if not payment_url:
            raise BusinessException("Moyasar did not return a payment URL")

        await self.payment_repository.update(
            payment,
            moyasar_payment_id=moyasar_result.get("id"),
            payment_url=payment_url,
            metadata={**metadata, "moyasar_status": moyasar_result.get("status")},
        )

        return {
            "subscription_id": subscription.id,
            "payment_id": payment.id,
            "payment_url": payment_url,
        }

    async def process_webhook(self, payload: dict[str, Any], secret_token: Optional[str] = None) -> dict[str, str]:
        self._verify_webhook_secret(payload, secret_token)

        moyasar_id, event_hint = self._extract_resource_id(payload)
        if not moyasar_id:
            raise BusinessException("Webhook payload missing payment/invoice id")

        # Prefer server-side verification over trusting payload status
        verified = await self.moyasar.verify_payment(moyasar_id)
        status = (verified.get("status") or "").lower()
        metadata = verified.get("metadata") or {}
        if not metadata:
            metadata = self._extract_metadata(payload)

        payment = await self._resolve_payment(moyasar_id, metadata)
        if not payment:
            raise NotFoundException("Payment not found for webhook event")

        if payment.status == PaymentStatus.PAID:
            return {"status": "already_processed", "payment_id": payment.id}

        source = verified.get("source") or {}
        payment_method = source.get("type") or source.get("company")

        # Update moyasar id if we stored invoice id and now have payment id
        real_id = verified.get("id") or moyasar_id
        if payment.moyasar_payment_id != real_id:
            await self.payment_repository.update(payment, moyasar_payment_id=real_id)

        if status == "paid":
            await self._mark_paid_and_activate(payment, payment_method=payment_method, metadata=metadata)
            return {"status": "activated", "payment_id": payment.id, "event": event_hint or "paid"}

        if status in {"failed", "expired", "canceled", "cancelled", "voided"}:
            await self.payment_repository.update(
                payment,
                status=PaymentStatus.FAILED,
                payment_method=payment_method,
                metadata={**(payment.metadata_json or {}), **metadata, "moyasar_status": status},
            )
            return {"status": "failed", "payment_id": payment.id}

        logger.info("Ignoring Moyasar webhook status=%s id=%s", status, moyasar_id)
        return {"status": "ignored", "payment_id": payment.id, "moyasar_status": status}

    async def _mark_paid_and_activate(
        self,
        payment: Payment,
        *,
        payment_method: Optional[str],
        metadata: dict[str, Any],
    ) -> None:
        await self.payment_repository.update(
            payment,
            status=PaymentStatus.PAID,
            payment_method=payment_method,
            metadata={**(payment.metadata_json or {}), **metadata, "moyasar_status": "paid"},
        )

        subscription = await self.subscription_repository.get_by_id(payment.subscription_id)
        if not subscription:
            raise NotFoundException("Subscription not found for payment")

        if subscription.status == SubscriptionStatus.ACTIVE:
            return

        plan = await self.plan_repository.get_by_id(subscription.plan_id)
        if not plan:
            raise NotFoundException("Subscription plan not found")

        starts_at = datetime.now(timezone.utc)
        expires_at = starts_at + timedelta(days=int(plan.duration_days))
        await self.subscription_repository.activate(
            subscription,
            starts_at=starts_at,
            expires_at=expires_at,
        )

    def _verify_webhook_secret(self, payload: dict[str, Any], header_secret: Optional[str]) -> None:
        expected = settings.moyasar_webhook_secret
        if not expected:
            if settings.environment.lower() == "production":
                raise RuntimeError("MOYASAR_WEBHOOK_SECRET is required in production")
            logger.warning("MOYASAR_WEBHOOK_SECRET not set; skipping webhook secret validation")
            return

        candidates = [
            header_secret,
            payload.get("secret_token"),
            payload.get("secret"),
            (payload.get("data") or {}).get("secret_token") if isinstance(payload.get("data"), dict) else None,
        ]
        if not any(c and hmac.compare_digest(str(c), expected) for c in candidates):
            raise UnauthorizedException("Invalid Moyasar webhook secret")

    def _extract_resource_id(self, payload: dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
        if payload.get("id") and not payload.get("data"):
            return str(payload["id"]), payload.get("type") or payload.get("status")

        data = payload.get("data")
        if isinstance(data, dict):
            if data.get("id"):
                return str(data["id"]), payload.get("type")
            payment = data.get("payment") or data.get("invoice")
            if isinstance(payment, dict) and payment.get("id"):
                return str(payment["id"]), payload.get("type")

        return None, payload.get("type")

    def _extract_metadata(self, payload: dict[str, Any]) -> dict[str, Any]:
        if isinstance(payload.get("metadata"), dict):
            return payload["metadata"]
        data = payload.get("data")
        if isinstance(data, dict):
            if isinstance(data.get("metadata"), dict):
                return data["metadata"]
            nested = data.get("payment") or data.get("invoice")
            if isinstance(nested, dict) and isinstance(nested.get("metadata"), dict):
                return nested["metadata"]
        return {}

    async def _resolve_payment(self, moyasar_id: str, metadata: dict[str, Any]) -> Optional[Payment]:
        payment = await self.payment_repository.get_by_moyasar_id(moyasar_id)
        if payment:
            return payment

        subscription_id = metadata.get("subscription_id")
        if subscription_id:
            payment = await self.payment_repository.get_by_subscription(str(subscription_id))
            if payment:
                return payment

        # Invoice may nest payments; metadata on our record is enough via subscription
        return None
