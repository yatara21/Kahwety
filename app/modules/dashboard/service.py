from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.modules.dashboard.schemas import DashboardCounts, DashboardAnalytics, DashboardResponse
from app.modules.users.models import User
from app.modules.cafes.models import Cafe
from app.modules.products.models import Product
from app.modules.offers.models import Offer
from app.modules.events.models import Event
from app.modules.complaints.models import Complaint
from app.modules.subscriptions.models import Subscription
from app.modules.subscription_plans.models import SubscriptionPlan
from app.modules.payments.models import Payment
from app.modules.suggested_cafes.models import SuggestedCafe
from app.common.enums import (
    UserRole,
    CafeRegistrationStatus,
    ComplaintStatus,
    SubscriptionStatus,
    BillingCycle,
    SubscriberType,
    PaymentStatus,
)


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_dashboard_stats(self) -> DashboardResponse:
        customers_count = await self._count_users_by_role(UserRole.CUSTOMER)
        cafe_owners_count = await self._count_users_by_role(UserRole.CAFE_OWNER)
        cafes_count = await self._count_cafes()
        pending_cafes_count = await self._count_cafes_by_status(CafeRegistrationStatus.PENDING)
        approved_cafes_count = await self._count_cafes_by_status(CafeRegistrationStatus.APPROVED)
        products_count = await self._count_products()
        offers_count = await self._count_offers()
        events_count = await self._count_events()
        complaints_count = await self._count_complaints()
        subscriptions_count = await self._count_subscriptions()
        active_subscriptions_count = await self._count_subscriptions_by_status(SubscriptionStatus.ACTIVE)
        monthly_subscriptions = await self._count_active_by_billing_cycle(BillingCycle.MONTHLY)
        annual_subscriptions = await self._count_active_by_billing_cycle(BillingCycle.ANNUAL)
        customer_subscribers = await self._count_active_by_subscriber_type(SubscriberType.CUSTOMER)
        cafe_subscribers = await self._count_active_by_subscriber_type(SubscriberType.CAFE_OWNER)
        pending_complaints_count = await self._count_complaints_by_status(ComplaintStatus.PENDING)
        resolved_complaints_count = await self._count_complaints_by_status(ComplaintStatus.RESOLVED)
        suggested_cafes_count = await self._count_suggested_cafes()
        subscription_revenue = await self._get_subscription_revenue()

        counts = DashboardCounts(
            customers=customers_count,
            cafe_owners=cafe_owners_count,
            cafes=cafes_count,
            pending_cafes=pending_cafes_count,
            approved_cafes=approved_cafes_count,
            products=products_count,
            offers=offers_count,
            events=events_count,
            complaints=complaints_count,
            subscriptions=subscriptions_count,
            active_subscriptions=active_subscriptions_count,
            monthly_subscriptions=monthly_subscriptions,
            annual_subscriptions=annual_subscriptions,
            customer_subscribers=customer_subscribers,
            cafe_subscribers=cafe_subscribers,
            pending_complaints=pending_complaints_count,
            resolved_complaints=resolved_complaints_count,
            suggested_cafes=suggested_cafes_count,
            subscription_revenue=subscription_revenue,
        )

        analytics = DashboardAnalytics(
            most_purchased_product=None,
            most_visited_cafe=None,
            least_visited_cafe=None,
        )

        return DashboardResponse(counts=counts, analytics=analytics)

    async def _count_users_by_role(self, role: UserRole) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(select(User).where(User.role == role).subquery())
        )
        return result.scalar() or 0

    async def _count_cafes(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(Cafe))
        return result.scalar() or 0

    async def _count_cafes_by_status(self, status: CafeRegistrationStatus) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(
                select(Cafe).where(Cafe.registration_status == status).subquery()
            )
        )
        return result.scalar() or 0

    async def _count_products(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(Product))
        return result.scalar() or 0

    async def _count_offers(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(Offer))
        return result.scalar() or 0

    async def _count_events(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(Event))
        return result.scalar() or 0

    async def _count_complaints(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(Complaint))
        return result.scalar() or 0

    async def _count_subscriptions(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(Subscription))
        return result.scalar() or 0

    async def _count_subscriptions_by_status(self, status: SubscriptionStatus) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(
                select(Subscription).where(Subscription.status == status).subquery()
            )
        )
        return result.scalar() or 0

    async def _count_active_by_billing_cycle(self, billing_cycle: BillingCycle) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Subscription)
            .join(SubscriptionPlan, Subscription.plan_id == SubscriptionPlan.id)
            .where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    SubscriptionPlan.billing_cycle == billing_cycle,
                )
            )
        )
        return result.scalar() or 0

    async def _count_active_by_subscriber_type(self, subscriber_type: SubscriberType) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Subscription)
            .join(SubscriptionPlan, Subscription.plan_id == SubscriptionPlan.id)
            .where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    SubscriptionPlan.subscriber_type == subscriber_type,
                )
            )
        )
        return result.scalar() or 0

    async def _count_complaints_by_status(self, status: ComplaintStatus) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(
                select(Complaint).where(Complaint.status == status).subquery()
            )
        )
        return result.scalar() or 0

    async def _count_suggested_cafes(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(SuggestedCafe))
        return result.scalar() or 0

    async def _get_subscription_revenue(self) -> float:
        result = await self.session.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.status == PaymentStatus.PAID
            )
        )
        return float(result.scalar() or 0)
