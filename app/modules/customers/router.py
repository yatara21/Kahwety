from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.customers.service import CustomerService
from app.modules.customers.schemas import CustomerResponse, CustomerUpdate
from app.common.enums import PagePermission
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[CustomerResponse]])
async def list_customers(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    current_user = Depends(require_page_permission(PagePermission.CUSTOMERS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CustomerService(session)
    customers, total = await service.list_customers_with_statistics(
        status=status,
        search=pagination.search,
        page=pagination.page,
        page_size=pagination.page_size
    )

    paginated = PaginatedResponse.create(
        items=[CustomerResponse(**customer) for customer in customers],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{customer_id}", response_model=SuccessResponse[CustomerResponse])
async def get_customer(
    customer_id: str,
    current_user = Depends(require_page_permission(PagePermission.CUSTOMERS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CustomerService(session)
    customer, stats = await service.get_customer(customer_id)
    
    customer_dict = CustomerResponse.model_validate(customer).model_dump()
    customer_dict["statistics"] = stats
    
    return SuccessResponse(data=CustomerResponse(**customer_dict))


@router.put("/{customer_id}", response_model=SuccessResponse[CustomerResponse])
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    current_user = Depends(require_page_permission(PagePermission.CUSTOMERS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CustomerService(session)
    customer = await service.update_customer(customer_id, customer_update)
    return SuccessResponse(data=CustomerResponse.model_validate(customer))
