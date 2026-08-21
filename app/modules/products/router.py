from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.permissions import require_page_permission, get_current_user
from app.modules.products.service import ProductService
from app.modules.products.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.common.enums import PagePermission, UserRole
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/cafe/{cafe_id}", response_model=SuccessResponse[PaginatedResponse[ProductResponse]])
async def list_products_by_cafe(
    cafe_id: str,
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    service = ProductService(session)
    products, total = await service.list_products_by_cafe(
        cafe_id=cafe_id,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("", response_model=SuccessResponse[PaginatedResponse[ProductResponse]])
async def list_all_products(
    pagination: PaginationParams = Depends(),
    current_user = Depends(require_page_permission(PagePermission.PRODUCTS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = ProductService(session)
    products, total = await service.list_all_products(
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{product_id}", response_model=SuccessResponse[ProductResponse])
async def get_product(
    product_id: str,
    session: AsyncSession = Depends(get_async_session)
):
    service = ProductService(session)
    product = await service.get_product(product_id)
    return SuccessResponse(data=ProductResponse.model_validate(product))


@router.post("", response_model=SuccessResponse[ProductResponse])
async def create_product(
    product_create: ProductCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    if current_user.role != UserRole.CAFE_OWNER:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Only cafe owners can create products")
    
    from app.modules.cafes.service import CafeService
    cafe_service = CafeService(session)
    await cafe_service.ensure_owner_owns_cafe(product_create.cafe_id, current_user.id)

    service = ProductService(session)
    product = await service.create_product(product_create)
    return SuccessResponse(data=ProductResponse.model_validate(product))


@router.put("/{product_id}", response_model=SuccessResponse[ProductResponse])
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = ProductService(session)
    product = await service.get_product(product_id)
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        cafe = await cafe_service.get_cafe(product.cafe_id)
        if cafe.owner_id != current_user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You can only update products of your own cafes")
    
    updated_product = await service.update_product(product_id, product_update)
    return SuccessResponse(data=ProductResponse.model_validate(updated_product))


@router.delete("/{product_id}", response_model=SuccessResponse[dict])
async def delete_product(
    product_id: str,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = ProductService(session)
    product = await service.get_product(product_id)
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        cafe = await cafe_service.get_cafe(product.cafe_id)
        if cafe.owner_id != current_user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You can only delete products of your own cafes")
    
    await service.delete_product(product_id)
    return SuccessResponse(data={"message": "Product deleted successfully"})
