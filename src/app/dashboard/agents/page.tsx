"use client";

import { AgentsTable } from "@/components/agents/agents-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";

export default function AgentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="text-primary cursor-pointer hover:underline">
              Dashboard
            </span>
            <span>›</span>
            <span className="font-medium text-foreground">Master Data</span>
            <span>›</span>
            <span className="font-medium text-foreground">Agents</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm">
            Manage external agents and agencies for booking references.
          </p>
        </div>
      </div>

      <div className="flex-1">
          <AgentsTable />
      </div>
    </div>
  );
}
