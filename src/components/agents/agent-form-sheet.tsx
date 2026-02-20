"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { createAgent, updateAgent, type Agent } from "@/lib/supabase/agents";

interface AgentFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentToEdit?: Agent | null;
  onSuccess: () => void;
}

export function AgentFormSheet({
  open,
  onOpenChange,
  agentToEdit,
  onSuccess,
}: AgentFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
  });

  // Reset form when opening or changing agent
  useEffect(() => {
    if (open) {
      if (agentToEdit) {
        setFormData({
          name: agentToEdit.name,
          email: agentToEdit.email || "",
          phone: agentToEdit.phone || "",
          company_name: agentToEdit.company_name || "",
        });
      } else {
        setFormData({
          name: "",
          email: "",
          phone: "",
          company_name: "",
        });
      }
    }
  }, [open, agentToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        company_name: formData.company_name || null,
      };

      if (agentToEdit) {
        await updateAgent(agentToEdit.id, payload);
      } else {
        await createAgent(payload);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save agent", error);
      alert("Failed to save agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {agentToEdit ? "Edit Agent" : "Add New Agent"}
          </SheetTitle>
          <SheetDescription>
            {agentToEdit
              ? "Update the agent's details below."
              : "Fill in the details to add a new external agent."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Agent Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="agent@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone / WhatsApp</Label>
            <Input
              id="phone"
              placeholder="+62..."
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company / Agency Name</Label>
            <Input
              id="company"
              placeholder="e.g. Travel Sentosa"
              value={formData.company_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  company_name: e.target.value,
                }))
              }
            />
          </div>

          <SheetFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className="size-4 animate-spin mr-2"
                />
              ) : (
                <HugeiconsIcon icon={Tick01Icon} className="size-4 mr-2" />
              )}
              {agentToEdit ? "Update Agent" : "Create Agent"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
