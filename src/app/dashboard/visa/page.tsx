"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VisaTable } from "@/components/visa/visa-table";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, PassportIcon, Settings01Icon } from "@hugeicons/core-free-icons";

// Basic Modal Implementation
function SimpleModal({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (category: 'First Time' | 'Extension') => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
            <div className="bg-background border rounded-lg shadow-lg p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-semibold mb-2">Select Visa Category</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Is this for a first-time applicant or a visa extension?
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => onSelect('First Time')}
                    >
                         <HugeiconsIcon icon={PassportIcon} strokeWidth={2} className="size-6" />
                        First Time
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => onSelect('Extension')}
                    >
                        <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} className="size-6" />
                        Extension
                    </Button>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
}

export default function VisaPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCategorySelect = (category: 'First Time' | 'Extension') => {
      setIsModalOpen(false);
      // Navigate to create page with category param
      router.push(`/dashboard/visa/create?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Visa Management</h2>
        <div className="flex items-center space-x-2">
            <Button onClick={() => setIsModalOpen(true)}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="mr-2 size-4" />
              Add New Visa
            </Button>
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <VisaTable />
      </div>

      <SimpleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={handleCategorySelect} 
      />
    </div>
  );
}
