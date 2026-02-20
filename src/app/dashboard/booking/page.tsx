"use client";

import { useState } from "react";
import { BookingTable } from "@/components/booking/booking-table";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Menu01Icon,
  Calendar01Icon,
  ChartHistogramIcon,
} from "@hugeicons/core-free-icons";

type ViewMode = "table" | "kanban" | "calendar" | "gantt";

export default function BookingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const views: { id: ViewMode; label: string; icon: typeof DashboardSquare01Icon }[] = [
    { id: "table", label: "Table", icon: Menu01Icon },
    { id: "kanban", label: "Kanban", icon: DashboardSquare01Icon },
    { id: "calendar", label: "Calendar", icon: Calendar01Icon },
    { id: "gantt", label: "Gantt", icon: ChartHistogramIcon },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="text-primary cursor-pointer hover:underline">Dashboard</span>
            <span>›</span>
            <span className="font-medium text-foreground">Task</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Task</h1>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-0.5 bg-muted/30">
          {views.map((view) => (
            <Button
              key={view.id}
              variant={viewMode === view.id ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs gap-1.5 px-3 rounded-md"
              onClick={() => setViewMode(view.id)}
              disabled={view.id !== "table"} // Only table is implemented for now
            >
              <HugeiconsIcon icon={view.icon} strokeWidth={2} className="size-3.5" />
              {view.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1">
        {viewMode === "table" && <BookingTable />}
        {viewMode === "kanban" && (
          <div className="flex items-center justify-center h-64 rounded-lg border border-dashed">
            <div className="text-center text-muted-foreground">
              <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={1.5} className="size-12 mx-auto mb-2 opacity-40" />
              <p className="font-medium">Kanban View</p>
              <p className="text-xs mt-1">Coming soon</p>
            </div>
          </div>
        )}
        {viewMode === "calendar" && (
          <div className="flex items-center justify-center h-64 rounded-lg border border-dashed">
            <div className="text-center text-muted-foreground">
              <HugeiconsIcon icon={Calendar01Icon} strokeWidth={1.5} className="size-12 mx-auto mb-2 opacity-40" />
              <p className="font-medium">Calendar View</p>
              <p className="text-xs mt-1">Coming soon</p>
            </div>
          </div>
        )}
        {viewMode === "gantt" && (
          <div className="flex items-center justify-center h-64 rounded-lg border border-dashed">
            <div className="text-center text-muted-foreground">
              <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={1.5} className="size-12 mx-auto mb-2 opacity-40" />
              <p className="font-medium">Gantt View</p>
              <p className="text-xs mt-1">Coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
