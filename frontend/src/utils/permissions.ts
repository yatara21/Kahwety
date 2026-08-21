import type { User } from "@/types";

const PAGE_PERMISSIONS = [
  "Dashboard",
  "Customers",
  "Cafe Owners",
  "Cafes",
  "Products",
  "Offers",
  "Events",
  "Subscriptions",
  "Complaints",
  "Notifications",
  "Admins",
  "Suggested Cafes",
] as const;

export function hasPagePermission(user: User | null, page: string): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "ADMIN") return PAGE_PERMISSIONS.includes(page as typeof PAGE_PERMISSIONS[number]);
  return false;
}

export function canAccessPage(user: User | null, page: string): boolean {
  return hasPagePermission(user, page);
}
