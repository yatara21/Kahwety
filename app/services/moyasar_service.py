from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Optional

import httpx

from app.core.config import settings
from app.core.exceptions import BusinessException
from app.core.logging import logger


class MoyasarService:
    """Async Moyasar client. Secret key is never exposed to clients."""

    def __init__(self) -> None:
        if not settings.moyasar_secret_key:
            raise BusinessException("Moyasar secret key is not configured")
        self.base_url = settings.moyasar_base_url.rstrip("/")
        self._auth = (settings.moyasar_secret_key, "")

    def _to_minor_units(self, amount: Decimal | float | int) -> int:
        value = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return int(value * 100)

    async def create_payment(
        self,
        *,
        amount: Decimal | float | int,
        currency: str,
        description: str,
        metadata: dict[str, str],
        callback_url: Optional[str] = None,
        success_url: Optional[str] = None,
        back_url: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create a Moyasar hosted checkout (invoice) and return payment URL.

        Moyasar Payments API requires card source data on create; hosted checkout
        is provided via the Invoices endpoint which returns a `url` for the payer.
        """
        payload: dict[str, Any] = {
            "amount": self._to_minor_units(amount),
            "currency": currency.upper(),
            "description": description,
            "metadata": {str(k): str(v) for k, v in metadata.items()},
        }
        cb = callback_url or settings.moyasar_callback_url
        if cb:
            payload["callback_url"] = cb
        if success_url or settings.moyasar_success_url:
            payload["success_url"] = success_url or settings.moyasar_success_url
        if back_url or settings.moyasar_back_url:
            payload["back_url"] = back_url or settings.moyasar_back_url

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/invoices",
                json=payload,
                auth=self._auth,
            )

        if response.status_code not in (200, 201):
            logger.error("Moyasar create payment failed: %s %s", response.status_code, response.text)
            raise BusinessException("Failed to create Moyasar payment")

        data = response.json()
        return {
            "id": data.get("id"),
            "status": data.get("status"),
            "amount": data.get("amount"),
            "currency": data.get("currency"),
            "url": data.get("url"),
            "description": data.get("description"),
            "metadata": data.get("metadata") or {},
            "raw": data,
        }

    async def fetch_payment(self, moyasar_payment_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/payments/{moyasar_payment_id}",
                auth=self._auth,
            )

        if response.status_code == 404:
            # Fallback: may be an invoice id from hosted checkout
            return await self.fetch_invoice(moyasar_payment_id)

        if response.status_code != 200:
            logger.error("Moyasar fetch payment failed: %s %s", response.status_code, response.text)
            raise BusinessException("Failed to fetch Moyasar payment")

        return response.json()

    async def fetch_invoice(self, invoice_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/invoices/{invoice_id}",
                auth=self._auth,
            )

        if response.status_code != 200:
            logger.error("Moyasar fetch invoice failed: %s %s", response.status_code, response.text)
            raise BusinessException("Failed to fetch Moyasar invoice")

        return response.json()

    async def verify_payment(self, moyasar_payment_id: str) -> dict[str, Any]:
        """Fetch payment/invoice from Moyasar and normalize status."""
        data = await self.fetch_payment(moyasar_payment_id)
        status = (data.get("status") or "").lower()

        # Invoice may include nested paid payments
        if status not in {"paid", "failed"} and data.get("payments"):
            for payment in data["payments"]:
                p_status = (payment.get("status") or "").lower()
                if p_status == "paid":
                    return {
                        "id": payment.get("id") or data.get("id"),
                        "status": "paid",
                        "amount": payment.get("amount", data.get("amount")),
                        "currency": payment.get("currency", data.get("currency")),
                        "source": payment.get("source") or {},
                        "metadata": payment.get("metadata") or data.get("metadata") or {},
                        "invoice_id": data.get("id"),
                        "raw": data,
                    }
                if p_status == "failed":
                    status = "failed"

        return {
            "id": data.get("id"),
            "status": status,
            "amount": data.get("amount"),
            "currency": data.get("currency"),
            "source": data.get("source") or {},
            "metadata": data.get("metadata") or {},
            "raw": data,
        }


def get_moyasar_service() -> MoyasarService:
    return MoyasarService()
