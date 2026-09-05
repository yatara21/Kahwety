from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.enums import (
    CafeRegistrationStatus,
    ComplaintStatus,
    EventStatus,
    OfferStatus,
    SubscriberType,
    UserRole,
)
from app.common.pagination import PaginatedResponse, PaginationParams
from app.common.responses import SuccessResponse
from app.core.database import get_async_session
from app.core.exceptions import ForbiddenException, NotFoundException
from app.core.permissions import get_current_user
from app.modules.cafes.schemas import CafeResponse
from app.modules.cafes.service import CafeService
from app.modules.complaints.schemas import ComplaintCreate, ComplaintResponse
from app.modules.complaints.service import ComplaintService
from app.modules.events.schemas import EventResponse
from app.modules.events.service import EventService
from app.modules.mobile.schemas import MobileComplaintCreate, MobileSuggestedCafeCreate
from app.modules.notifications.schemas import NotificationResponse
from app.modules.notifications.service import NotificationService
from app.modules.offers.schemas import OfferResponse
from app.modules.offers.service import OfferService
from app.modules.products.schemas import ProductResponse
from app.modules.products.service import ProductService
from app.modules.subscription_plans.schemas import SubscriptionPlanResponse
from app.modules.subscription_plans.service import SubscriptionPlanService
from app.modules.subscriptions.schemas import (
    SubscribeResponse,
    SubscriptionCreateRequest,
    SubscriptionResponse,
)
from app.modules.subscriptions.service import SubscriptionService
from app.modules.suggested_cafes.schemas import SuggestedCafeCreate, SuggestedCafeResponse
from app.modules.suggested_cafes.service import SuggestedCafeService


router = APIRouter(prefix="/mobile", tags=["Mobile API"])


async def _get_public_cafe(cafe_id: str, session: AsyncSession):
    cafe = await CafeService(session).get_cafe(cafe_id)
    if cafe.registration_status != CafeRegistrationStatus.APPROVED or not cafe.is_active:
        raise NotFoundException("Cafe not found")
    return cafe


# ─────────────────────────────────────────────────────────────
# Cafes
# ─────────────────────────────────────────────────────────────

@router.get("/cafes", response_model=SuccessResponse[PaginatedResponse[CafeResponse]])
async def list_mobile_cafes(
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    cafes, total = await CafeService(session).list_public_cafes(
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[CafeResponse.model_validate(cafe) for cafe in cafes],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


@router.get("/cafes/nearby", response_model=SuccessResponse[PaginatedResponse[CafeResponse]])
async def list_mobile_nearby_cafes(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5.0, gt=0, le=100),
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    cafes, total = await CafeService(session).list_nearby_cafes(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[CafeResponse.model_validate(cafe) for cafe in cafes],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


@router.get("/cafes/{cafe_id}", response_model=SuccessResponse[CafeResponse])
async def get_mobile_cafe(
    cafe_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    cafe = await _get_public_cafe(cafe_id, session)
    return SuccessResponse(data=CafeResponse.model_validate(cafe))


@router.get("/cafes/{cafe_id}/products", response_model=SuccessResponse[PaginatedResponse[ProductResponse]])
async def list_mobile_products(
    cafe_id: str,
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    await _get_public_cafe(cafe_id, session)
    products, total = await ProductService(session).list_products_by_cafe(
        cafe_id=cafe_id,
        page=pagination.page,
        page_size=pagination.page_size,
        available_only=True,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[ProductResponse.model_validate(product) for product in products],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


@router.get("/cafes/{cafe_id}/offers", response_model=SuccessResponse[PaginatedResponse[OfferResponse]])
async def list_mobile_cafe_offers(
    cafe_id: str,
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    await _get_public_cafe(cafe_id, session)
    offers, total = await OfferService(session).list_offers_by_cafe(
        cafe_id=cafe_id,
        status=OfferStatus.ACTIVE,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[OfferResponse.model_validate(offer) for offer in offers],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


@router.get("/cafes/{cafe_id}/events", response_model=SuccessResponse[PaginatedResponse[EventResponse]])
async def list_mobile_cafe_events(
    cafe_id: str,
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    await _get_public_cafe(cafe_id, session)
    events, total = await EventService(session).list_events_by_cafe(
        cafe_id=cafe_id,
        status=EventStatus.PUBLISHED,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[EventResponse.model_validate(event) for event in events],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


# ─────────────────────────────────────────────────────────────
# Global Offers Feed (public)
# ─────────────────────────────────────────────────────────────

@router.get("/offers", response_model=SuccessResponse[PaginatedResponse[OfferResponse]])
async def list_mobile_offers(
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    offers, total = await OfferService(session).list_all_active_offers(
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[OfferResponse.model_validate(offer) for offer in offers],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


@router.get("/offers/{offer_id}", response_model=SuccessResponse[OfferResponse])
async def get_mobile_offer(
    offer_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    offer = await OfferService(session).get_offer(offer_id)
    return SuccessResponse(data=OfferResponse.model_validate(offer))


# ─────────────────────────────────────────────────────────────
# Global Events Feed (public)
# ─────────────────────────────────────────────────────────────

@router.get("/events", response_model=SuccessResponse[PaginatedResponse[EventResponse]])
async def list_mobile_events(
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    events, total = await EventService(session).list_all_published_events(
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[EventResponse.model_validate(event) for event in events],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


@router.get("/events/{event_id}", response_model=SuccessResponse[EventResponse])
async def get_mobile_event(
    event_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    event = await EventService(session).get_event(event_id)
    return SuccessResponse(data=EventResponse.model_validate(event))


# ─────────────────────────────────────────────────────────────
# Complaints (authenticated customer)
# ─────────────────────────────────────────────────────────────

@router.get("/complaints", response_model=SuccessResponse[PaginatedResponse[ComplaintResponse]])
async def list_mobile_complaints(
    status: Optional[ComplaintStatus] = None,
    pagination: PaginationParams = Depends(),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    if current_user.role != UserRole.CUSTOMER:
        raise ForbiddenException("Only customers can view mobile complaints")
    complaints, total = await ComplaintService(session).list_complaints_by_customer(
        customer_id=current_user.id,
        status=status,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[ComplaintResponse.model_validate(complaint) for complaint in complaints],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


@router.get("/complaints/{complaint_id}", response_model=SuccessResponse[ComplaintResponse])
async def get_mobile_complaint(
    complaint_id: str,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    if current_user.role != UserRole.CUSTOMER:
        raise ForbiddenException("Only customers can view complaints")
    complaint = await ComplaintService(session).get_complaint(complaint_id)
    if complaint.customer_id != current_user.id:
        raise ForbiddenException("You can only view your own complaints")
    return SuccessResponse(data=ComplaintResponse.model_validate(complaint))


@router.post("/complaints", response_model=SuccessResponse[ComplaintResponse])
async def create_mobile_complaint(
    complaint: MobileComplaintCreate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    if current_user.role != UserRole.CUSTOMER:
        raise ForbiddenException("Only customers can create mobile complaints")
    await _get_public_cafe(complaint.cafe_id, session)
    created = await ComplaintService(session).create_complaint(
        ComplaintCreate(
            customer_id=current_user.id,
            cafe_id=complaint.cafe_id,
            subject=complaint.subject,
            description=complaint.description,
        )
    )
    return SuccessResponse(data=ComplaintResponse.model_validate(created))


# ─────────────────────────────────────────────────────────────
# Notifications (authenticated user feed)
# ─────────────────────────────────────────────────────────────

@router.get("/notifications", response_model=SuccessResponse[PaginatedResponse[NotificationResponse]])
async def list_mobile_notifications(
    pagination: PaginationParams = Depends(),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    notifications, total = await NotificationService(session).list_user_notifications(
        user_id=current_user.id,
        user_role=current_user.role,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[NotificationResponse.model_validate(n) for n in notifications],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


# ─────────────────────────────────────────────────────────────
# Subscription Plans (public)
# ─────────────────────────────────────────────────────────────

@router.get("/plans", response_model=SuccessResponse[PaginatedResponse[SubscriptionPlanResponse]])
async def list_mobile_plans(
    subscriber_type: Optional[SubscriberType] = None,
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    plans, total = await SubscriptionPlanService(session).list_plans(
        is_active=True,
        subscriber_type=subscriber_type,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[SubscriptionPlanResponse.model_validate(plan) for plan in plans],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


# ─────────────────────────────────────────────────────────────
# Subscriptions (authenticated)
# ─────────────────────────────────────────────────────────────

@router.post("/subscriptions", response_model=SuccessResponse[SubscribeResponse])
async def create_mobile_subscription(
    body: SubscriptionCreateRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    if current_user.role not in (UserRole.CUSTOMER, UserRole.CAFE_OWNER):
        raise ForbiddenException("Only customers and cafe owners can subscribe")
    result = await SubscriptionService(session).subscribe(current_user, body.plan_id)
    return SuccessResponse(data=SubscribeResponse(**result))


@router.get("/subscriptions/me", response_model=SuccessResponse[Optional[SubscriptionResponse]])
async def get_my_mobile_subscription(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    subscription = await SubscriptionService(session).get_my_subscription(current_user.id)
    if not subscription:
        return SuccessResponse(data=None)
    return SuccessResponse(data=SubscriptionResponse.model_validate(subscription))


@router.get(
    "/subscriptions/history",
    response_model=SuccessResponse[PaginatedResponse[SubscriptionResponse]],
)
async def list_mobile_subscription_history(
    pagination: PaginationParams = Depends(),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    subscriptions, total = await SubscriptionService(session).list_history(
        user_id=current_user.id,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(
        data=PaginatedResponse.create(
            items=[SubscriptionResponse.model_validate(item) for item in subscriptions],
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )
    )


# ─────────────────────────────────────────────────────────────
# Suggested Cafes (authenticated — any registered user)
# ─────────────────────────────────────────────────────────────

@router.post("/suggested-cafes", response_model=SuccessResponse[SuggestedCafeResponse])
async def submit_suggested_cafe(
    data: MobileSuggestedCafeCreate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    service = SuggestedCafeService(session)
    cafe = await service.create(
        SuggestedCafeCreate(
            owner_name=data.owner_name,
            city=data.city,
            phone=data.phone,
            google_link=data.google_link,
            website=data.website,
            facebook=data.facebook,
            instagram=data.instagram,
            telegram=data.telegram,
        )
    )
    return SuccessResponse(data=SuggestedCafeResponse.model_validate(cafe))
