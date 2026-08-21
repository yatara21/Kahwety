export interface User {
  id: string;
  role: "CUSTOMER" | "CAFE_OWNER" | "ADMIN" | "SUPER_ADMIN";
  full_name: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  email_verified: boolean;
  phone_verified: boolean;
  profile_image: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  pages?: string[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
}

export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface Cafe {
  id: string;
  owner_id: string;
  approved_by: string | null;
  name: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  registration_status: "PENDING" | "APPROVED" | "REJECTED";
  registration_date: string | null;
  working_hours: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: User;
  subscription?: Subscription;
  branches?: Branch[];
  products?: Product[];
  offers?: Offer[];
  events?: CafeEvent[];
}

export interface Branch {
  id: string;
  cafe_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  working_hours: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  cafe_id: string;
  name: string;
  name_en?: string;
  description: string;
  price: number;
  image_url: string | null;
  image?: string;
  availability: boolean;
  created_at: string;
  updated_at: string;
  cafe?: Cafe;
}

export interface Offer {
  id: string;
  cafe_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  image_url: string | null;
  start_date: string;
  end_date: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "DISABLED";
  created_at: string;
  updated_at: string;
  cafe?: Cafe;
}

export interface CafeEvent {
  id: string;
  cafe_id: string;
  title: string;
  description: string;
  location: string;
  image_url: string | null;
  event_date: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  created_at: string;
  updated_at: string;
  cafe?: Cafe;
}

export interface Complaint {
  id: string;
  customer_id: string;
  cafe_id: string;
  subject: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "NOTIFICATION_SENT" | "TRANSFERRED_TO_CAFE" | "RESOLVED";
  admin_response: string | null;
  cafe_response: string | null;
  created_at: string;
  updated_at: string;
  customer?: User;
  cafe?: Cafe;
}

export interface SuggestedCafe {
  id: string;
  owner_name: string;
  city: string;
  phone: string;
  google_link: string | null;
  status: "NEW" | "SENT" | "APPROVED" | "REJECTED";
  admin_notes: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriberType = "CUSTOMER" | "CAFE_OWNER";
export type BillingCycle = "MONTHLY" | "ANNUAL";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  subscriber_type: SubscriberType;
  billing_cycle: BillingCycle;
  price: number;
  currency: string;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  plan?: SubscriptionPlan;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string;
  moyasar_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  payment_url: string | null;
  metadata?: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface SubscribeCheckoutResponse {
  subscription_id: string;
  payment_id: string;
  payment_url: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  plan_id: string | null;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  target_type: "ALL" | "CUSTOMER" | "CAFE_OWNER" | "CAFE" | "USER";
  target_id: string | null;
  created_at: string;
}

export interface PagePermissionEntry {
  id: string;
  user_id: string;
  page: string;
}

export interface CustomerStatistics {
  id: string;
  user_id: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spent: number;
}

export interface DashboardStats {
  counts: {
    customers: number;
    cafe_owners: number;
    cafes: number;
    pending_cafes: number;
    approved_cafes: number;
    products: number;
    offers: number;
    events: number;
    complaints: number;
    subscriptions: number;
    active_subscriptions: number;
    monthly_subscriptions: number;
    annual_subscriptions: number;
    customer_subscribers: number;
    cafe_subscribers: number;
    pending_complaints: number;
    resolved_complaints: number;
    suggested_cafes: number;
    subscription_revenue: number;
  };
  analytics: {
    most_purchased_product: string | null;
    most_visited_cafe: string | null;
    least_visited_cafe: string | null;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}
