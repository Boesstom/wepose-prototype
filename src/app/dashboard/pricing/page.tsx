
import { Metadata } from "next";
import { PricingDashboard } from "@/components/pricing/pricing-dashboard";

export const metadata: Metadata = {
  title: "Pricing Manager | Wepose Dashboard",
  description: "Manage visa pricing, agent tiers, and special offers.",
};

export default function PricingPage() {
  return (
    <div className="flex flex-col h-full w-full bg-muted/10 p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pricing Manager</h1>
        <p className="text-muted-foreground">
          Manage visa prices, agent discounts, and promotional campaigns efficiently.
        </p>
      </div>
      <PricingDashboard />
    </div>
  );
}
