from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, update
from typing import Optional, List
from datetime import datetime, timezone
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.common.enums import UserRole, UserStatus


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_create: UserCreate) -> User:
        password_hash = get_password_hash(user_create.password) if user_create.password else None
        user = User(
            role=user_create.role,
            full_name=user_create.full_name,
            email=user_create.email,
            phone=user_create.phone,
            password_hash=password_hash,
            google_id=user_create.google_id,
            profile_image=user_create.profile_image,
            email_verified=user_create.email_verified,
            phone_verified=user_create.phone_verified,
            status=user_create.status,
        )
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def create_google_user(
        self,
        *,
        role: UserRole,
        full_name: str,
        email: str,
        google_id: str,
        profile_image: Optional[str] = None,
        email_verified: bool = True,
    ) -> User:
        user = User(
            role=role,
            full_name=full_name,
            email=email,
            password_hash=None,
            google_id=google_id,
            profile_image=profile_image,
            email_verified=email_verified,
            status=UserStatus.ACTIVE,
        )
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def get_by_id(self, user_id: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.phone == phone))
        return result.scalar_one_or_none()

    async def get_by_google_id(self, google_id: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.google_id == google_id))
        return result.scalar_one_or_none()

    async def list_phones_by_role(self, role: UserRole) -> List[str]:
        result = await self.session.execute(
            select(User.phone).where(User.role == role, User.phone.isnot(None))
        )
        return [phone for phone in result.scalars().all() if phone]

    async def email_exists(self, email: str, exclude_id: Optional[str] = None) -> bool:
        query = select(User).where(User.email == email)
        if exclude_id:
            query = query.where(User.id != exclude_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None

    async def phone_exists(self, phone: str, exclude_id: Optional[str] = None) -> bool:
        query = select(User).where(User.phone == phone)
        if exclude_id:
            query = query.where(User.id != exclude_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None

    async def update(self, user: User, user_update: UserUpdate) -> User:
        if user_update.full_name is not None:
            user.full_name = user_update.full_name
        if user_update.email is not None:
            user.email = user_update.email
        if user_update.phone is not None:
            user.phone = user_update.phone
        if user_update.status is not None:
            user.status = user_update.status
        if user_update.profile_image is not None:
            user.profile_image = user_update.profile_image

        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def update_last_login(self, user: User) -> User:
        user.last_login = datetime.now(timezone.utc)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def link_google_id(self, user: User, google_id: str) -> User:
        user.google_id = google_id
        if not user.email_verified:
            user.email_verified = True
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def mark_phone_verified(self, user: User) -> User:
        user.phone_verified = True
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def delete(self, user: User) -> None:
        await self.session.delete(user)
        await self.session.flush()

    async def list_by_role(
        self,
        role: UserRole,
        status: Optional[UserStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[User], int]:
        query = select(User).where(User.role == role)

        if status:
            query = query.where(User.status == status)

        if search:
            query = query.where(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.phone.ilike(f"%{search}%"),
                )
            )

        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()

        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(User.created_at.desc())

        result = await self.session.execute(query)
        users = result.scalars().all()

        return list(users), total

    async def list_all(
        self,
        status: Optional[UserStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[User], int]:
        query = select(User)

        if status:
            query = query.where(User.status == status)

        if search:
            query = query.where(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.phone.ilike(f"%{search}%"),
                )
            )

        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()

        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(User.created_at.desc())

        result = await self.session.execute(query)
        users = result.scalars().all()

        return list(users), total
