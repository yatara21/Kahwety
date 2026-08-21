from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger


class OAuthProvider(ABC):

    @abstractmethod
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        pass


class GoogleOAuthProvider(OAuthProvider):

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests

            payload = google_id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.google_client_id,
            )

            return {
                "sub": payload["sub"],
                "email": payload.get("email"),
                "name": payload.get("name"),
                "email_verified": payload.get("email_verified", False),
                "picture": payload.get("picture"),
            }

        except Exception as e:
            logger.warning(f"Google ID token verification failed: {e}")
            return None


def get_oauth_provider() -> OAuthProvider:
    if settings.google_client_id:
        return GoogleOAuthProvider()
    return _NoOpProvider()


class _NoOpProvider(OAuthProvider):
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return None
