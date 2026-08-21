from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission, get_current_user
from app.modules.offers.service import OfferService
from app.modules.offers.schemas import OfferCreate, OfferUpdate, OfferResponse
from app.common.enums import PagePermission, UserRole
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/offers", tags=["Offers"])


@router.get("/cafe/{cafe_id}", response_model=SuccessResponse[PaginatedResponse[OfferResponse]])
async def list_offers_by_cafe(
    cafe_id: str,
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    session: AsyncSession = Depends(get_async_session)
):
    service = OfferService(session)
    offers, total = await service.list_offers_by_cafe(
        cafe_id=cafe_id,
        status=status,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[OfferResponse.model_validate(o) for o in offers],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("", response_model=SuccessResponse[PaginatedResponse[OfferResponse]])
async def list_all_offers(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    current_user = Depends(require_page_permission(PagePermission.OFFERS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = OfferService(session)
    offers, total = await service.list_all_offers(
        status=status,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[OfferResponse.model_validate(o) for o in offers],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{offer_id}", response_model=SuccessResponse[OfferResponse])
async def get_offer(
    offer_id: str,
    session: AsyncSession = Depends(get_async_session)
):
    service = OfferService(session)
    offer = await service.get_offer(offer_id)
    return SuccessResponse(data=OfferResponse.model_validate(offer))


@router.post("", response_model=SuccessResponse[OfferResponse])
async def create_offer(
    offer_create: OfferCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    if current_user.role != UserRole.CAFE_OWNER:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Only cafe owners can create offers")
    
    from app.modules.cafes.service import CafeService
    cafe_service = CafeService(session)
    await cafe_service.ensure_owner_owns_cafe(offer_create.cafe_id, current_user.id)

    service = OfferService(session)
    offer = await service.create_offer(offer_create)
    return SuccessResponse(data=OfferResponse.model_validate(offer))


@router.put("/{offer_id}", response_model=SuccessResponse[OfferResponse])
async def update_offer(
    offer_id: str,
    offer_update: OfferUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = OfferService(session)
    offer = await service.get_offer(offer_id)
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        cafe = await cafe_service.get_cafe(offer.cafe_id)
        if cafe.owner_id != current_user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You can only update offers of your own cafes")
    
    updated_offer = await service.update_offer(offer_id, offer_update)
    return SuccessResponse(data=OfferResponse.model_validate(updated_offer))


@router.delete("/{offer_id}", response_model=SuccessResponse[dict])
async def delete_offer(
    offer_id: str,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = OfferService(session)
    offer = await service.get_offer(offer_id)
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        cafe = await cafe_service.get_cafe(offer.cafe_id)
        if cafe.owner_id != current_user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You can only delete offers of your own cafes")
    
    await service.delete_offer(offer_id)
    return SuccessResponse(data={"message": "Offer deleted successfully"})
