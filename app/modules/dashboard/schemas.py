from pydantic import BaseModel
from typing import Optional


class DashboardCounts(BaseModel):
    customers: int
    cafe_owners: int
    cafes: int
    pending_cafes: int
    approved_cafes: int
    products: int
    offers: int
    events: int
    complaints: int
    subscriptions: int
    active_subscriptions: int
    monthly_subscriptions: int
    annual_subscriptions: int
    customer_subscribers: int
    cafe_subscribers: int
    pending_complaints: int
    resolved_complaints: int
    suggested_cafes: int
    subscription_revenue: float


class DashboardAnalytics(BaseModel):
    most_purchased_product: Optional[str] = None
    most_visited_cafe: Optional[str] = None
    least_visited_cafe: Optional[str] = None


class DashboardResponse(BaseModel):
    counts: DashboardCounts
    analytics: DashboardAnalytics
