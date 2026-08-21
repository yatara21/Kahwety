"""Quick live check against Moyasar API using .env credentials."""
import asyncio
import httpx
from app.core.config import settings


async def main() -> None:
    base = settings.moyasar_base_url.rstrip("/")
    auth = (settings.moyasar_secret_key or "", "")
    print("base_url:", base)
    print("publishable:", (settings.moyasar_publishable_key or "")[:16] + "...")
    print("secret:", (settings.moyasar_secret_key or "")[:16] + "...")

    async with httpx.AsyncClient(timeout=30.0) as client:
        payments = await client.get(f"{base}/payments", auth=auth, params={"per": 1})
        print("GET /payments =>", payments.status_code)
        data = payments.json()
        print("payments_count_keys:", list(data.keys()) if isinstance(data, dict) else type(data))

        payload = {
            "amount": 100,
            "currency": "SAR",
            "description": "Cafe Platform subscription live test",
            "metadata": {
                "test": "true",
                "source": "mvp_check",
            },
        }
        if settings.moyasar_callback_url:
            payload["callback_url"] = settings.moyasar_callback_url
        if settings.moyasar_success_url:
            payload["success_url"] = settings.moyasar_success_url
        if settings.moyasar_back_url:
            payload["back_url"] = settings.moyasar_back_url

        invoice = await client.post(f"{base}/invoices", json=payload, auth=auth)
        print("POST /invoices =>", invoice.status_code)
        inv = invoice.json()
        print("invoice_id:", inv.get("id"))
        print("invoice_status:", inv.get("status"))
        print("invoice_url:", inv.get("url"))
        print("invoice_amount:", inv.get("amount"), inv.get("currency"))


if __name__ == "__main__":
    asyncio.run(main())
