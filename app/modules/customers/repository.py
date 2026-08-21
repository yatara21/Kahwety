from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from app.modules.users.models import User
from app.modules.customers.models import CustomerStatistics
from app.modules.users.schemas import UserUpdate
from app.common.enums import UserRole, UserStatus


class CustomerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def list_customers(
        self,
        status: Optional[UserStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[User], int]:
        query = select(User).where(User.role == UserRole.CUSTOMER)
        
        if status:
            query = query.where(User.status == status)
        
        if search:
            query = query.where(
                User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
            )
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(User.created_at.desc())
        
        result = await self.session.execute(query)
        users = result.scalars().all()
        
        return list(users), total
    
    async def get_customer(self, customer_id: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(
                and_(
                    User.id == customer_id,
                    User.role == UserRole.CUSTOMER
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_customer_statistics(self, customer_id: str) -> Optional[CustomerStatistics]:
        result = await self.session.execute(
            select(CustomerStatistics).where(CustomerStatistics.user_id == customer_id)
        )
        return result.scalar_one_or_none()
    
    async def create_customer_statistics(self, customer_id: str) -> CustomerStatistics:
        statistics = CustomerStatistics(
            user_id=customer_id,
            total_orders=0,
            completed_orders=0,
            cancelled_orders=0,
            total_spent=0
        )
        self.session.add(statistics)
        await self.session.flush()
        await self.session.refresh(statistics)
        return statistics
    
    async def get_or_create_statistics(self, customer_id: str) -> CustomerStatistics:
        statistics = await self.get_customer_statistics(customer_id)
        if not statistics:
            statistics = await self.create_customer_statistics(customer_id)
        return statistics
