"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getCurrentUser, logout } from "@/services/auth.service";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultationsPanel } from "@/components/practitioner/consultations-panel";
import { MeetingTimingsPanel } from "@/components/practitioner/meeting-timings-panel";

export function PractitionerDashboard() {
  const router = useRouter();
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  React.useEffect(() => {
    if (!isLoading && (!user || user.role !== "PRACTITIONER")) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  if (isLoading) {
    return (
      <Section spacing="default">
        <Container>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-6 h-64" />
        </Container>
      </Section>
    );
  }

  if (!user || user.role !== "PRACTITIONER") {
    // Redirecting via the effect above.
    return null;
  }

  return (
    <Section spacing="default">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-eyebrow text-sage-dark">Practitioner Dashboard</p>
            <h1 className="mt-2 font-display text-3xl text-ink">
              Welcome back, {user.fullName}
            </h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </div>

        <Tabs defaultValue="consultations" className="mt-10">
          <TabsList>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="timings">Meeting Timings</TabsTrigger>
          </TabsList>
          <TabsContent value="consultations">
            <ConsultationsPanel />
          </TabsContent>
          <TabsContent value="timings">
            <MeetingTimingsPanel />
          </TabsContent>
        </Tabs>
      </Container>
    </Section>
  );
}
