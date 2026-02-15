"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  DashboardSquare01Icon,
  Menu01Icon,
  ArrowRight01Icon,
  PassportIcon,
  Location01Icon,
  GlobalIcon,
} from "@hugeicons/core-free-icons";

// Supabase integration
import { getVisas, deleteVisa, type VisaWithDocuments } from "@/lib/supabase/visas";
import { getCountries, type Address } from "@/lib/supabase/addresses";

// ─────────────────────────────────────────────
// Types & Helpers
// ─────────────────────────────────────────────

interface CountryGroup {
  country: string;
  flag: string;
  visas: VisaWithDocuments[];
}

// Helper: group visas by country
function groupVisasByCountry(visas: VisaWithDocuments[], countries: Address[]): CountryGroup[] {
  const map = new Map<string, VisaWithDocuments[]>();
  
  // Create a map of country name -> flag
  const flagMap = new Map<string, string>();
  countries.forEach(c => flagMap.set(c.name.toLowerCase(), c.flag || "🏳️"));

  visas.forEach((visa) => {
    const country = visa.country || "Unknown";
    if (!map.has(country)) {
      map.set(country, []);
    }
    map.get(country)!.push(visa);
  });

  return Array.from(map.entries())
    .map(([country, visas]) => ({
      country,
      flag: flagMap.get(country.toLowerCase()) || "🏳️",
      visas,
    }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatProcessingTime(visa: VisaWithDocuments) {
  if (visa.processing_time_type === "fix" && visa.processing_time_fix) {
    return `${visa.processing_time_fix} Working Days`;
  }
  if (visa.processing_time_type === "range" && visa.processing_time_min && visa.processing_time_max) {
    return `${visa.processing_time_min}-${visa.processing_time_max} Working Days`;
  }
  return "-";
}

function formatStayDuration(days: number | null) {
  return days ? `${days} Days` : "-";
}

// ─────────────────────────────────────────────
// Country Detail Dialog
// ─────────────────────────────────────────────
function CountryDetailDialog({
  group,
  open,
  onOpenChange,
  onDelete,
}: {
  group: CountryGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <span className="text-3xl">{group.flag}</span>
            <div>
              <div>{group.country}</div>
              <DialogDescription>
                {group.visas.length} visa type{group.visas.length > 1 ? "s" : ""}{" "}
                available
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {group.visas.map((visa) => (
            <div
              key={visa.id}
              className="rounded-lg border bg-muted/30 p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              {/* Visa Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{visa.name}</h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {visa.type}
                    </Badge>
                    <Badge
                      variant={
                        visa.application_method === "Online"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {visa.application_method}
                    </Badge>
                    {visa.category && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      >
                        {visa.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-primary">
                    {formatCurrency(visa.price, visa.currency)}
                  </div>
                </div>
              </div>

              {/* Visa Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    strokeWidth={2}
                    className="size-3.5 text-muted-foreground/70"
                  />
                  <span>
                    <span className="text-foreground font-medium">Stay:</span>{" "}
                    {formatStayDuration(visa.stay_duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    strokeWidth={2}
                    className="size-3.5 text-muted-foreground/70"
                  />
                  <span>
                    <span className="text-foreground font-medium">Process:</span>{" "}
                    {formatProcessingTime(visa)}
                  </span>
                </div>
              </div>

              {/* Documents */}
              {visa.visa_documents.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
                    Required Documents
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {visa.visa_documents.map((vd) => (
                      <Badge
                        key={vd.id}
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {vd.document?.name || "Unknown Doc"}
                        {vd.is_mandatory && <span className="text-red-500 ml-0.5">*</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs gap-1"
                  onClick={() => router.push(`/dashboard/visa/${visa.id}/edit`)}
                >
                  <HugeiconsIcon
                    icon={Edit01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                  onClick={() => onDelete(visa.id)}
                >
                  <HugeiconsIcon
                    icon={Delete01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Card View (Primary)
// ─────────────────────────────────────────────
function CardView({ 
  visas, 
  countries,
  onDelete 
}: { 
  visas: VisaWithDocuments[]; 
  countries: Address[];
  onDelete: (id: string) => void;
}) {
  const [selectedGroup, setSelectedGroup] = useState<CountryGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const groups = useMemo(() => groupVisasByCountry(visas, countries), [visas, countries]);

  const handleViewDetail = (group: CountryGroup) => {
    setSelectedGroup(group);
    setDialogOpen(true);
  };

  if(!visas.length) {
     return <div className="text-center py-12 text-muted-foreground">No visas found. Create one to get started.</div>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map((group) => {
          // Get unique visa type badges
          const visaTypes = [...new Set(group.visas.map((v) => v.name))];
          const priceRange = {
            min: Math.min(...group.visas.map((v) => v.price)),
            max: Math.max(...group.visas.map((v) => v.price)),
          };
         
          return (
            <Card
              key={group.country}
              className="group/visa-card cursor-pointer hover:ring-primary/40 transition-all duration-300 hover:shadow-md relative overflow-hidden"
              onClick={() => handleViewDetail(group)}
            >
              {/* Decorative gradient top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 group-hover/visa-card:opacity-100 transition-opacity duration-300" />

              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="text-4xl leading-none select-none">{group.flag}</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-bold truncate">
                      {group.country}
                    </CardTitle>
                    <CardDescription className="mt-0.5">
                      {group.visas.length} visa type
                      {group.visas.length > 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-2">
                {/* Visa types list */}
                <div className="space-y-1.5">
                  {visaTypes.slice(0, 3).map((type) => (
                    <div
                      key={type}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <HugeiconsIcon
                        icon={PassportIcon}
                        strokeWidth={2}
                        className="size-3.5 text-primary/60 shrink-0"
                      />
                      <span className="truncate">{type}</span>
                    </div>
                  ))}
                  {visaTypes.length > 3 && (
                    <div className="text-[11px] text-muted-foreground/60 pl-5">
                      +{visaTypes.length - 3} more...
                    </div>
                  )}
                </div>

                {/* Price range */}
                <div className="flex items-center gap-1.5 text-xs">
                  <HugeiconsIcon
                    icon={GlobalIcon}
                    strokeWidth={2}
                    className="size-3.5 text-emerald-500 shrink-0"
                  />
                  <span className="text-muted-foreground">
                    {priceRange.min === priceRange.max
                      ? formatCurrency(priceRange.min, group.visas[0].currency)
                      : `${formatCurrency(priceRange.min, group.visas[0].currency)} – ${formatCurrency(priceRange.max, group.visas[0].currency)}`}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 text-primary hover:text-primary group-hover/visa-card:bg-primary/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetail(group);
                  }}
                >
                  View Detail
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-3.5 transition-transform group-hover/visa-card:translate-x-0.5"
                  />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <CountryDetailDialog
        group={selectedGroup}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDelete={onDelete}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Table View (Secondary)
// ─────────────────────────────────────────────
function TableView({ 
  visas, 
  countries,
  onDelete
}: { 
  visas: VisaWithDocuments[]; 
  countries: Address[];
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

    // Helper map for flags
  const flagMap = useMemo(() => {
    const map = new Map<string, string>();
    countries.forEach(c => map.set(c.name.toLowerCase(), c.flag || "🏳️"));
    return map;
  }, [countries]);

  if(!visas.length) {
     return <div className="text-center py-12 text-muted-foreground">No visas found. Create one to get started.</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Country</TableHead>
            <TableHead>Visa Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visas.map((visa) => (
            <TableRow key={visa.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">
                    {flagMap.get((visa.country || "").toLowerCase()) || "🏳️"}
                  </span>
                  <span className="text-xs font-medium">{visa.country}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{visa.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{visa.type}</Badge>
              </TableCell>
              <TableCell>
                {formatCurrency(visa.price, visa.currency)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    visa.application_method === "Online" ? "default" : "secondary"
                  }
                >
                  {visa.application_method}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => router.push(`/dashboard/visa/${visa.id}/edit`)}
                  >
                    <HugeiconsIcon
                      icon={Edit01Icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(visa.id)}
                  >
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Visa Table Component
// ─────────────────────────────────────────────
export function VisaTable() {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [visas, setVisas] = useState<VisaWithDocuments[]>([]);
  const [countries, setCountries] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
        setLoading(true);
        const [visasData, countriesData] = await Promise.all([
            getVisas(),
            getCountries()
        ]);
        setVisas(visasData);
        setCountries(countriesData);
    } catch (error) {
        console.error("Failed to fetch visa data", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure you want to delete this visa?")) return;
      try {
          await deleteVisa(id);
          await fetchData();
      } catch (error) {
          console.error("Failed to delete visa", error);
      }
  }

  if (loading) {
      return <div className="py-8 text-center text-muted-foreground">Loading visas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {visas.length} visa{visas.length !== 1 ? "s" : ""} across{" "}
          {new Set(visas.map((v) => v.country)).size} countries
        </p>
        <div className="flex items-center gap-1 rounded-md border p-0.5 bg-muted/30">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1.5 px-3"
            onClick={() => setViewMode("card")}
          >
            <HugeiconsIcon
              icon={DashboardSquare01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1.5 px-3"
            onClick={() => setViewMode("table")}
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Table
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "card" ? (
          <CardView visas={visas} countries={countries} onDelete={handleDelete} />
      ) : (
          <TableView visas={visas} countries={countries} onDelete={handleDelete} />
      )}
    </div>
  );
}
