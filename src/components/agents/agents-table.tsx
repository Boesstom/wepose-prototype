"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  Search01Icon,
  PlusSignIcon,
  UserGroupIcon,
  Call02Icon,
  Mail01Icon,
  Building03Icon,
} from "@hugeicons/core-free-icons";
import { getAgents, deleteAgent, type Agent } from "@/lib/supabase/agents";
import { AgentFormSheet } from "@/components/agents/agent-form-sheet";

export function AgentsTable() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAgents();
      setAgents(data);
    } catch (error) {
      console.error("Failed to fetch agents", error);
      setLoadingError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      await deleteAgent(id);
      await fetchAgents();
    } catch (error) {
      console.error("Failed to delete agent", error);
      alert("Failed to delete agent.");
    }
  };

  const filteredAgents = useMemo(() => {
    if (!query) return agents;
    const q = query.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        (agent.email && agent.email.toLowerCase().includes(q)) ||
        (agent.company_name && agent.company_name.toLowerCase().includes(q))
    );
  }, [agents, query]);

  return (
    <div className="space-y-4">
      {/* ─── Toolbar ─── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            placeholder="Search agents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            setSelectedAgent(null);
            setDialogOpen(true);
          }}
          className="h-9 gap-2"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Add Agent
        </Button>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-muted-foreground">
          Loading agents...
        </div>
      ) : loadingError ? (
        <div className="text-center py-8 text-red-500">
          Failed to load agents. Please try again.
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <HugeiconsIcon
            icon={UserGroupIcon}
            className="size-10 mx-auto text-muted-foreground/50 mb-3"
          />
          <p className="text-muted-foreground mb-4">No agents found.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedAgent(null);
              setDialogOpen(true);
            }}
          >
            Create First Agent
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Agent Name</TableHead>
                <TableHead>Company / Agency</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-base">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Since {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {agent.company_name ? (
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Building03Icon}
                          className="size-3.5 text-muted-foreground"
                        />
                        <span>{agent.company_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {agent.email && (
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Mail01Icon}
                            className="size-3.5 text-muted-foreground"
                          />
                          <span>{agent.email}</span>
                        </div>
                      )}
                      {agent.phone && (
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Call02Icon}
                            className="size-3.5 text-muted-foreground"
                          />
                          <span>{agent.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setDialogOpen(true);
                        }}
                      >
                        <HugeiconsIcon icon={Edit01Icon} className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(agent.id)}
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AgentFormSheet
        open={dialogOpen}
        onOpenChange={(val) => {
          setDialogOpen(val);
          if (!val) setSelectedAgent(null);
        }}
        agentToEdit={selectedAgent}
        onSuccess={fetchAgents}
      />
    </div>
  );
}
