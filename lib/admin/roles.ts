import type { UserRole } from "@/lib/db/schema";

export const TENANT_ASSIGNABLE_ROLES = [
  "empleado",
  "supervisor",
  "rh",
  "admin_empresa",
] as const satisfies readonly UserRole[];

export type TenantAssignableRole = (typeof TENANT_ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<TenantAssignableRole, string> = {
  empleado: "Empleado",
  supervisor: "Supervisor",
  rh: "Recursos Humanos",
  admin_empresa: "Admin de empresa",
};

export function isTenantAssignableRole(role: string): role is TenantAssignableRole {
  return TENANT_ASSIGNABLE_ROLES.includes(role as TenantAssignableRole);
}
