import { BaseLayout } from "@/components/layout/base-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BaseLayout>{children}</BaseLayout>;
}
