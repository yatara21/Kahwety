from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.customers.repository import CustomerRepository
from app.modules.customers.schemas import CustomerUpdate
from app.modules.users.repository import UserRepository
from app.modules.users.models import User
from app.core.exceptions import NotFoundException, ConflictException


class CustomerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.customer_repository = CustomerRepository(session)
        self.user_repository = UserRepository(session)
    
    async def list_customers(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[User], int]:
        from app.common.enums import UserStatus
        status_enum = UserStatus(status) if status else None
        return await self.customer_repository.list_customers(status_enum, search, page, page_size)

    async def list_customers_with_statistics(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[dict], int]:
        customers, total = await self.list_customers(status, search, page, page_size)
        customer_items: List[dict] = []

        for customer in customers:
            stats = await self.customer_repository.get_or_create_statistics(customer.id)
            customer_items.append({
                "id": customer.id,
                "full_name": customer.full_name,
                "email": customer.email,
                "phone": customer.phone,
                "status": customer.status,
                "created_at": customer.created_at,
                "updated_at": customer.updated_at,
                "statistics": {
                    "user_id": stats.user_id,
                    "total_orders": stats.total_orders,
                    "completed_orders": stats.completed_orders,
                    "cancelled_orders": stats.cancelled_orders,
                    "total_spent": float(stats.total_spent),
                },
            })

        return customer_items, total
    
    async def get_customer(self, customer_id: str) -> tuple[User, Optional[dict]]:
        customer = await self.customer_repository.get_customer(customer_id)
        if not customer:
            raise NotFoundException("Customer not found")
        
        statistics = await self.customer_repository.get_or_create_statistics(customer_id)
        
        stats_dict = {
            "user_id": statistics.user_id,
            "total_orders": statistics.total_orders,
            "completed_orders": statistics.completed_orders,
            "cancelled_orders": statistics.cancelled_orders,
            "total_spent": float(statistics.total_spent)
        }
        
        return customer, stats_dict
    
    async def update_customer(self, customer_id: str, customer_update: CustomerUpdate) -> User:
        customer = await self.customer_repository.get_customer(customer_id)
        if not customer:
            raise NotFoundException("Customer not found")
        
        from app.modules.users.schemas import UserUpdate as UserUpdateSchema
        from app.common.enums import UserStatus
        
        user_update = UserUpdateSchema(
            full_name=customer_update.full_name,
            email=customer_update.email,
            phone=customer_update.phone,
            status=UserStatus(customer_update.status) if customer_update.status else None
        )
        
        # Check if email already exists
        if user_update.email and await self.user_repository.email_exists(user_update.email, exclude_id=customer_id):
            raise ConflictException("Email already registered")
        
        # Check if phone already exists
        if user_update.phone and await self.user_repository.phone_exists(user_update.phone, exclude_id=customer_id):
            raise ConflictException("Phone number already registered")
        
        return await self.user_repository.update(customer, user_update)
