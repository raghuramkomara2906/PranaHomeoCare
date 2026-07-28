"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAdminLogout, useAdminMe } from "@/hooks/use-admin-auth";
import { useDashboard } from "../../hooks/use-admin-dashboard";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary } from "@/lib/types/api";

type MetricKey = Exclude<keyof DashboardSummary, "timezone">;

const CARDS: { key: MetricKey; label: string; accent?: boolean }[] = [
  { key: "todaysAppointments", label: "Today's appointments" },
  { key: "upcomingAppointments", label: "Upcoming appointments" },
  { key: "teleconsultationsToday", label: "Teleconsultations today" },
  { key: "videoConsultationsToday", label: "Video consultations today" },
  { key: "videoLinksPending", label: "Video links pending", accent: true },
  { key: "availableSlots", label: "Available slots" },
  { key: "cancelledToday", label: "Cancelled today" },
  { key: "smsDeliveryFailures", label: "SMS delivery failures", accent: true },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const me = useAdminMe();
  const logout = useAdminLogout();
  const dashboard = useDashboard(me.isSuccess);

  React.useEffect(() => {
    if (me.isError) router.replace("/admin/login");
  }, [me.isError, router]);

  if (me.isLoading) {
    return (
      <Container className="py-16">
        <Skeleton className="h-9 w-56" />
      </Container>
    );
  }
  if (!me.data) return null; // redirecting to login

  return (
    <Container className="py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-tight text-ink">
            Dashboard
          </h1>
          <p className="text-ink-soft">
            {me.data.doctor?.displayName ?? me.data.email}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => router.replace("/admin/login"),
            })
          }
        >
          Sign out
        </Button>
      </div>

      {dashboard.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : dashboard.isError ? (
        <p role="alert" className="text-clay-dark">
          Couldn&apos;t load the dashboard. Please refresh.
        </p>
      ) : dashboard.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => {
            const dashboardData = dashboard.data as DashboardSummary;
            const value = dashboardData[card.key];
            const highlight = card.accent && value > 0;
            return (
              <Card
                key={card.key}
                className={highlight ? "border-clay/50 bg-clay-light/40" : undefined}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-medium text-ink-soft">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="font-mono text-4xl text-ink">{value}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </Container>
  );
}