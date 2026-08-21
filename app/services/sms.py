from abc import ABC, abstractmethod
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class SMSProvider(ABC):
    """Abstract base class for SMS providers."""

    @abstractmethod
    async def send_otp(self, phone: str, otp: str) -> bool:
        """Send OTP code to phone number."""
        pass

    @abstractmethod
    async def verify_otp(self, phone: str, otp: str) -> bool:
        """Verify OTP code for phone number."""
        pass

    @abstractmethod
    async def send_sms(self, phone: str, message: str) -> bool:
        """Send a generic SMS message to phone number."""
        pass


class TwilioSMSProvider(SMSProvider):
    """Twilio provider for OTP (Verify) and generic SMS (Messaging) flows."""

    def __init__(self, account_sid: str, auth_token: str, verify_sid: str, phone_number: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.verify_sid = verify_sid
        self.phone_number = phone_number

    async def send_otp(self, phone: str, otp: str) -> bool:
        """Request Twilio Verify to send an OTP to the phone number.

        The otp argument is ignored because Twilio Verify generates the code.
        """
        try:
            from twilio.rest import Client

            client = Client(self.account_sid, self.auth_token)
            verification = client.verify.v2.services(self.verify_sid).verifications.create(
                to=phone,
                channel="sms",
            )
            return verification.status in {"pending", "approved"}
        except Exception as exc:
            logger.exception("Twilio send_otp failed: %s", exc)
            return False

    async def verify_otp(self, phone: str, otp: str) -> bool:
        """Verify OTP code against Twilio Verify."""
        try:
            from twilio.rest import Client

            client = Client(self.account_sid, self.auth_token)
            check = client.verify.v2.services(self.verify_sid).verification_checks.create(
                to=phone,
                code=otp,
            )
            return check.status == "approved"
        except Exception as exc:
            logger.exception("Twilio verify_otp failed: %s", exc)
            return False

    async def send_sms(self, phone: str, message: str) -> bool:
        """Send a generic SMS message using Twilio Messaging API."""
        if not self.phone_number:
            logger.error("Twilio send_sms failed: TWILIO_PHONE_NUMBER is not configured")
            return False
        try:
            from twilio.rest import Client

            client = Client(self.account_sid, self.auth_token)
            result = client.messages.create(
                to=phone,
                from_=self.phone_number,
                body=message,
            )
            return result.status in {"queued", "sent", "delivered"}
        except Exception as exc:
            logger.exception("Twilio send_sms failed: %s", exc)
            return False


class DevelopmentSMSProvider(SMSProvider):
    """Log-based provider used in development when Twilio is not configured.

    OTP codes and messages are written to the logs so flows can be tested
    without a real SMS gateway. The dev verification code is 123456.
    """

    dev_otp_code = "123456"

    async def send_otp(self, phone: str, otp: str) -> bool:
        logger.warning("[DEV SMS] OTP for %s: %s (use code %s to verify)", phone, otp, self.dev_otp_code)
        return True

    async def verify_otp(self, phone: str, otp: str) -> bool:
        valid = otp == self.dev_otp_code
        logger.warning("[DEV SMS] Verify OTP for %s: %s -> %s", phone, otp, "approved" if valid else "denied")
        return valid

    async def send_sms(self, phone: str, message: str) -> bool:
        logger.warning("[DEV SMS] Message to %s: %s", phone, message)
        return True


def is_sms_configured() -> bool:
    """Return True when all required Twilio settings are present."""
    return bool(
        settings.twilio_sid
        and settings.twilio_auth_token
        and settings.twilio_verify_sid
    )


def get_sms_provider() -> SMSProvider:
    """Factory function to get SMS provider instance.

    Returns a Twilio provider when credentials are configured, otherwise a
    development (log-based) provider in non-production environments. In
    production a RuntimeError is raised when Twilio is not configured.
    """
    if is_sms_configured():
        return TwilioSMSProvider(
            account_sid=settings.twilio_sid,
            auth_token=settings.twilio_auth_token,
            verify_sid=settings.twilio_verify_sid,
            phone_number=settings.twilio_phone_number or "",
        )

    missing: list[str] = []
    if not settings.twilio_sid:
        missing.append("TWILIO_SID")
    if not settings.twilio_auth_token:
        missing.append("TWILIO_AUTH_TOKEN")
    if not settings.twilio_verify_sid:
        missing.append("TWILIO_VERIFY_SID")

    if settings.environment.lower() == "production":
        raise RuntimeError(f"Missing required Twilio configuration: {', '.join(missing)}")

    logger.warning(
        "Twilio is not configured (missing: %s). Using DevelopmentSMSProvider (log-based). "
        "Set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID in .env to use real SMS.",
        ", ".join(missing),
    )
    return DevelopmentSMSProvider()