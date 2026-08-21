from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List, Any
from app.modules.payments.models import Payment
from app.common.enums import PaymentStatus


class PaymentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        *,
        user_id: str,
        subscription_id: str,
        amount: float,
        currency: str,
        status: PaymentStatus = PaymentStatus.PENDING,
        moyasar_payment_id: Optional[str] = None,
        payment_method: Optional[str] = None,
        payment_url: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> Payment:
        payment = Payment(
            user_id=user_id,
            subscription_id=subscription_id,
            amount=amount,
            currency=currency,
            status=status,
            moyasar_payment_id=moyasar_payment_id,
            payment_method=payment_method,
            payment_url=payment_url,
            metadata_json=metadata,
        )
        self.session.add(payment)
        await self.session.flush()
        await self.session.refresh(payment)
        return payment

    async def get_by_id(self, payment_id: str) -> Optional[Payment]:
        result = await self.session.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalar_one_or_none()

    async def get_by_moyasar_id(self, moyasar_payment_id: str) -> Optional[Payment]:
        result = await self.session.execute(
            select(Payment).where(Payment.moyasar_payment_id == moyasar_payment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_subscription(self, subscription_id: str) -> Optional[Payment]:
        result = await self.session.execute(
            select(Payment)
            .where(Payment.subscription_id == subscription_id)
            .order_by(Payment.created_at.desc())
        )
        return result.scalars().first()

    async def list_by_user(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Payment], int]:
        query = select(Payment).where(Payment.user_id == user_id)
        total = (await self.session.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
        query = query.order_by(Payment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def update(
        self,
        payment: Payment,
        *,
        status: Optional[PaymentStatus] = None,
        moyasar_payment_id: Optional[str] = None,
        payment_method: Optional[str] = None,
        payment_url: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> Payment:
        if status is not None:
            payment.status = status
        if moyasar_payment_id is not None:
            payment.moyasar_payment_id = moyasar_payment_id
        if payment_method is not None:
            payment.payment_method = payment_method
        if payment_url is not None:
            payment.payment_url = payment_url
        if metadata is not None:
            payment.metadata_json = metadata
        await self.session.flush()
        await self.session.refresh(payment)
        return payment
