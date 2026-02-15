import { Suspense } from "react";
import { VisaForm } from "@/components/visa/visa-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export default function CreateVisaPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create New Visa</h2>
      </div>
      <div className="flex-1">
        <Suspense 
          fallback={
            <div className="flex justify-center items-center min-h-[400px]">
              <HugeiconsIcon icon={Loading03Icon} className="animate-spin size-8 text-primary" />
            </div>
          }
        >
          <VisaForm />
        </Suspense>
      </div>
    </div>
  );
}
