from enum import Enum


class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    CAFE_OWNER = "CAFE_OWNER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class CafeRegistrationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class OfferStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    DISABLED = "DISABLED"


class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class ComplaintStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    NOTIFICATION_SENT = "NOTIFICATION_SENT"
    TRANSFERRED_TO_CAFE = "TRANSFERRED_TO_CAFE"
    RESOLVED = "RESOLVED"


class SubscriptionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
    PENDING = "PENDING"


class SubscriberType(str, Enum):
    CUSTOMER = "CUSTOMER"
    CAFE_OWNER = "CAFE_OWNER"


class BillingCycle(str, Enum):
    MONTHLY = "MONTHLY"
    ANNUAL = "ANNUAL"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"


class NotificationTargetType(str, Enum):
    ALL = "ALL"
    CUSTOMER = "CUSTOMER"
    CAFE_OWNER = "CAFE_OWNER"
    CAFE = "CAFE"
    USER = "USER"


class SuggestedCafeStatus(str, Enum):
    NEW = "NEW"
    SENT = "SENT"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PagePermission(str, Enum):
    DASHBOARD = "Dashboard"
    CUSTOMERS = "Customers"
    CAFE_OWNERS = "Cafe Owners"
    CAFES = "Cafes"
    PRODUCTS = "Products"
    OFFERS = "Offers"
    EVENTS = "Events"
    SUBSCRIPTIONS = "Subscriptions"
    COMPLAINTS = "Complaints"
    NOTIFICATIONS = "Notifications"
    ADMINS = "Admins"
    SUGGESTED_CAFES = "Suggested Cafes"
