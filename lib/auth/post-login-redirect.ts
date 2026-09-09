import type { UserRole } from "@/lib/db/schema";

export function getPostLoginRedirect(
  role: UserRole,
  nextPath?: string | null,
): string {
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }

  switch (role) {
    case "super_admin":
      return "/admin/super";
    case "admin_empresa":
      return "/admin";
    default:
      return "/chat";
  }
}

export function getHomeRedirect(role: UserRole): string {
  return getPostLoginRedirect(role);
}
