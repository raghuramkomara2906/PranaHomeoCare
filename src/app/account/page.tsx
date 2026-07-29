"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAccountAppointments, useAccountLogout, useAccountMe } from "@/hooks/use-account";
import { AccountAppointmentCard } from "@/components/account/account-appointment-card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountPage() {
  const router = useRouter();
  const me = useAccountMe();
  const appts = useAccountAppointments(Boolean(me.data));
  const logout = useAccountLogout();

  React.useEffect(() => {
    if (me.isError) router.replace("/login");
  }, [me.isError, router]);

  if (me.isLoading || me.isError) {
    return (
      <Container className="max-w-2xl py-16">
        <Skeleton className="h-8 w-40" />
      </Container>
    );
  }

  const now = Date.now();
  const list = appts.data?.appointments ?? [];
  const upcoming = list.filter(
    (a) => a.status === "confirmed" && new Date(a.endAt).getTime() >= now
  );
  const past = list.filter(
    (a) => !(a.status === "confirmed" && new Date(a.endAt).getTime() >= now)
  );

  return (
    <Container className="max-w-2xl py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Your appointments</h1>
          {me.data && (
            <p className="mt-1 text-sm text-ink-soft">{me.data.mobileMasked}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, { onSuccess: () => router.replace("/") })
          }
        >
          Sign out
        </Button>
      </div>

      {appts.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-ink-soft">You don&apos;t have any appointments yet.</p>
          <Button asChild className="mt-4">
            <a href="/book">Book a consultation</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint">
                Upcoming
              </h2>
              {upcoming.map((a) => (
                <AccountAppointmentCard key={a.id} item={a} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wide text-ink-faint">
                Past & cancelled
              </h2>
              {past.map((a) => (
                <AccountAppointmentCard key={a.id} item={a} />
              ))}
            </section>
          )}
        </div>
      )}
    </Container>
  );
}