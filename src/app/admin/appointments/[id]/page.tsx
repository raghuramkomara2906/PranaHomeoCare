import { AdminAppointmentDetail } from "@/components/admin/admin-appointment-detail";

export default async function AdminAppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminAppointmentDetail id={id} />;
}