"use client";

import type { ReactNode } from "react";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAdminLogout, useAdminMe } from "@/hooks/use-admin-auth";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const me = useAdminMe(!isLogin);
  const logout = useAdminLogout();

  React.useEffect(() => {
    if (!isLogin && me.isError) router.replace("/admin/login");
  }, [isLogin, me.isError, router]);

  if (isLogin) return <>{children}</>;

  const link = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={cn(
        "text-sm transition-colors",
        active ? "text-ink" : "text-ink-soft hover:text-ink"
      )}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <nav className="border-b border-border bg-surface">
        <Container className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-lg text-ink">
              Clinic admin
            </Link>
            {link("/admin", "Dashboard", pathname === "/admin")}
            {link(
              "/admin/appointments",
              "Appointments",
              pathname?.startsWith("/admin/appointments") ?? false
            )}
            {link(
              "/admin/appointments",
              "Appointments",
              pathname?.startsWith("/admin/appointments") ?? false
            )}
            {link(
              "/admin/slots",
              "Availability",
              pathname?.startsWith("/admin/slots") ?? false
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => router.replace("/admin/login"),
              })
            }
          >
            Sign out
          </Button>
        </Container>
      </nav>
      {children}
    </div>
  );
}