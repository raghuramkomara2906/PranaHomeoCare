"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import type { AppointmentStatus } from "@/lib/types";
import { formatDateInZone, formatTimeInZone, getLocalTimeZone } from "@/lib/format";
import { getCurrentUser, logout } from "@/services/auth.service";
import { cancelAppointment, getMyAppointments } from "@/services/appointments.service";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { JoinConsultationPanel } from "@/components/dashboard/join-consultation-panel";

const ACTIVE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "RESCHEDULED"];

const STATUS_BADGE: Record<AppointmentStatus, BadgeProps["variant"]> = {
  SLOT_HELD: "outline",
  PENDING: "gold",
  CONFIRMED: "sage",
  RESCHEDULED: "sky",
  CANCELLED_BY_PATIENT: "clay",
  CANCELLED_BY_PRACTITIONER: "clay",
  COMPLETED: "teal",
  NO_SHOW: "clay",
  EXPIRED: "outline",
};

export function PatientDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  React.useEffect(() => {
    if (!isLoadingUser && !user) {
      router.replace("/login");
    }
  }, [isLoadingUser, user, router]);

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["myAppointments"],
    queryFn: getMyAppointments,
    enabled: Boolean(user),
  });

  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myAppointments"] }),
  });

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  if (isLoadingUser) {
    return (
      <Section spacing="default">
        <Container>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-6 h-64" />
        </Container>
      </Section>
    );
  }

  if (!user) {
    // Redirecting via the effect above.
    return null;
  }

  const upcoming = (appointments ?? [])
    .filter(
      (a) =>
        ACTIVE_STATUSES.includes(a.status) &&
        new Date(a.startTimeUtc).getTime() >= (now ?? Number.POSITIVE_INFINITY)
    )
    .sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime());
  const past = (appointments ?? [])
    .filter((a) => !upcoming.includes(a))
    .sort((a, b) => new Date(b.startTimeUtc).getTime() - new Date(a.startTimeUtc).getTime());

  const [next, ...restUpcoming] = upcoming;
  const viewerTimeZone = getLocalTimeZone();

  return (
    <Section spacing="default">
      <Container className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-eyebrow text-sage-dark">Your Dashboard</p>
            <h1 className="mt-2 font-display text-3xl text-ink">
              Welcome back, {user.fullName}
            </h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </div>

        {isLoadingAppointments || now === null ? (
          <div className="mt-10 grid gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-24" />
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong py-16 text-center">
            <CalendarX2 className="size-6 text-ink-faint" aria-hidden="true" />
            <p className="max-w-sm text-sm text-ink-soft">
              No appointments yet. This only shows bookings made with{" "}
              <span className="font-medium text-ink">{user.email}</span> —
              if you booked as a guest with a different email, it won&apos;t
              appear here.
            </p>
            <Button asChild className="mt-2">
              <Link href="/book">Book a consultation</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-10">
            {next ? (
              <div>
                <JoinConsultationPanel appointment={next} />
              </div>
            ) : null}

            {restUpcoming.length > 0 ? (
              <div>
                <h2 className="font-display text-lg text-ink">
                  Upcoming appointments
                </h2>
                <div className="mt-4 grid gap-3">
                  {restUpcoming.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-display text-lg text-ink">
                              {appointment.serviceName}
                            </p>
                            <Badge variant={STATUS_BADGE[appointment.status]}>
                              {appointment.status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-ink-soft">
                            {formatDateInZone(appointment.startTimeUtc, viewerTimeZone)}
                          </p>
                          <p className="font-mono text-sm text-ink-soft">
                            {formatTimeInZone(appointment.startTimeUtc, viewerTimeZone)}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={cancelMutation.isPending}
                          onClick={() => {
                            if (window.confirm("Cancel this appointment?")) {
                              cancelMutation.mutate(appointment.id);
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}

            {past.length > 0 ? (
              <div>
                <h2 className="font-display text-lg text-ink">Past appointments</h2>
                <div className="mt-4 grid gap-3">
                  {past.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-display text-lg text-ink">
                              {appointment.serviceName}
                            </p>
                            <Badge variant={STATUS_BADGE[appointment.status]}>
                              {appointment.status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-ink-soft">
                            {formatDateInZone(appointment.startTimeUtc, viewerTimeZone)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Container>
    </Section>
  );
}
