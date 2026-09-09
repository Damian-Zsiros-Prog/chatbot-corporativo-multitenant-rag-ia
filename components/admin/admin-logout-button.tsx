"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-sm px-3 py-1.5 rounded-md border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)] disabled:opacity-50"
    >
      {loading ? "..." : "Salir"}
    </button>
  );
}
