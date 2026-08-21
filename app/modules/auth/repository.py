from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timezone
from typing import Optional
from app.modules.auth.models import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, user_id: str, token: str, expires_at: datetime) -> RefreshToken:
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        self.session.add(refresh_token)
        await self.session.flush()
        await self.session.refresh(refresh_token)
        return refresh_token
    
    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        result = await self.session.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.token == token,
                    RefreshToken.revoked_at.is_(None)
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def revoke(self, refresh_token: RefreshToken) -> RefreshToken:
        refresh_token.revoked_at = datetime.now(timezone.utc)
        await self.session.flush()
        await self.session.refresh(refresh_token)
        return refresh_token
    
    async def revoke_all_user_tokens(self, user_id: str) -> None:
        from sqlalchemy import update
        stmt = (
            update(RefreshToken)
            .where(and_(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)))
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await self.session.execute(stmt)
        await self.session.flush()
    
    async def delete_expired(self) -> None:
        from sqlalchemy import delete
        stmt = (
            delete(RefreshToken)
            .where(and_(RefreshToken.expires_at < datetime.now(timezone.utc), RefreshToken.revoked_at.isnot(None)))
        )
        await self.session.execute(stmt)
        await self.session.flush()
