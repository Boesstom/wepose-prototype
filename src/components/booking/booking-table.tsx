"use client";

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  FilterIcon,
  Cancel01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Edit01Icon,
  MoreVerticalIcon,
  Download01Icon,
  PlusSignIcon,
  Tick01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import {
  type Booking,
  type BookingStatus,
  getDeadlineUrgency,
  getDaysUntilDeparture,
  calculateSubmissionDeadline,
} from "@/types/booking";
import {
  mockBookings,
  allStatusOptions,
} from "@/data/mock-bookings";

// ─────────────────────────────────────────────
// Status Badge Config
// ─────────────────────────────────────────────

const statusConfig: Record<BookingStatus, { bg: string; text: string; border: string }> = {
  "New": {
    bg: "bg-emerald-500",
    text: "text-white",
    border: "border-emerald-600",
  },
  "On Process": {
    bg: "bg-amber-500",
    text: "text-white",
    border: "border-amber-600",
  },
  "Ready To Submit": {
    bg: "bg-sky-500",
    text: "text-white",
    border: "border-sky-600",
  },
  "Waiting - Need More Info": {
    bg: "bg-orange-400",
    text: "text-white",
    border: "border-orange-500",
  },
  "Submitted": {
    bg: "bg-indigo-500",
    text: "text-white",
    border: "border-indigo-600",
  },
  "Approved": {
    bg: "bg-teal-500",
    text: "text-white",
    border: "border-teal-600",
  },
  "Rejected": {
    bg: "bg-rose-500",
    text: "text-white",
    border: "border-rose-600",
  },
  "Finished - Approved": {
    bg: "bg-emerald-600",
    text: "text-white",
    border: "border-emerald-700",
  },
  "Finished - Rejected": {
    bg: "bg-rose-600",
    text: "text-white",
    border: "border-rose-700",
  },
  "Cancelled": {
    bg: "bg-gray-400",
    text: "text-white",
    border: "border-gray-500",
  },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[11px] font-semibold leading-tight whitespace-nowrap ${config.bg} ${config.text}`}
    >
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
// PIC / Analyst Badge
// ─────────────────────────────────────────────

const picColors = [
  "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400",
  "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  "bg-sky-500/15 text-sky-700 dark:text-sky-400",
];

const specialPicColors: Record<string, string> = {
  "NADYA (TRAINEE)": "bg-amber-400 text-white",
  "VIRA": "bg-emerald-500 text-white",
  "ERIANDA PIC": "bg-rose-500 text-white",
  "ZULFA": "bg-violet-500 text-white",
  "ERIANDA": "bg-rose-500 text-white",
  "CHERINA": "bg-pink-500 text-white",
};

function PersonBadge({ name, highlight }: { name: string | null; highlight?: boolean }) {
  if (!name) return <span className="text-xs text-muted-foreground">-</span>;

  const upperName = name.toUpperCase();
  const specialColor = specialPicColors[upperName];

  if (specialColor || highlight) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold whitespace-nowrap ${specialColor || "bg-primary text-primary-foreground"}`}
      >
        {name}
      </span>
    );
  }

  // Deterministic color based on name
  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    picColors.length;
  const color = picColors[colorIndex];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium whitespace-nowrap ${color}`}
    >
      {name}
    </span>
  );
}

// ─────────────────────────────────────────────
// Appointment Badge  
// ─────────────────────────────────────────────

function AppointmentBadge({ status, date }: { status: string; date: string | null }) {
  const color = status === "No Appointment" 
    ? "text-orange-500 bg-orange-500/10" 
    : status === "Scheduled" 
    ? "text-blue-500 bg-blue-500/10" 
    : status === "Completed"
    ? "text-emerald-500 bg-emerald-500/10"
    : status === "Rescheduled"
    ? "text-amber-500 bg-amber-500/10"
    : "text-rose-500 bg-rose-500/10";

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium whitespace-nowrap ${color}`}>
        {status}
      </span>
      {date && (
        <span className="text-[10px] text-muted-foreground pl-0.5">
          {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Country Flag Helper
// ─────────────────────────────────────────────

const countryFlags: Record<string, string> = {
  China: "🇨🇳",
  Japan: "🇯🇵",
  Korea: "🇰🇷",
  Taiwan: "🇹🇼",
  Vietnam: "🇻🇳",
  Thailand: "🇹🇭",
  Singapore: "🇸🇬",
  Malaysia: "🇲🇾",
  Australia: "🇦🇺",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
};

// ─────────────────────────────────────────────
// Deadline indicator
// ─────────────────────────────────────────────

function DeadlineIndicator({ booking }: { booking: Booking }) {
  const urgency = getDeadlineUrgency(
    booking.departureDate,
    booking.visaPackage.processingTimeDays
  );
  const daysUntilDeparture = getDaysUntilDeparture(booking.departureDate);
  const deadline = calculateSubmissionDeadline(
    booking.departureDate,
    booking.visaPackage.processingTimeDays
  );

  const urgencyConfig = {
    overdue: { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", icon: "🔴", label: "OVERDUE" },
    critical: { color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-500/10", icon: "🟠", label: "Critical" },
    urgent: { color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10", icon: "🟡", label: "Urgent" },
    normal: { color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-500/10", icon: "🔵", label: "Normal" },
    comfortable: { color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: "🟢", label: "On Track" },
  };

  const config = urgencyConfig[urgency];

  // If booking is finished or cancelled, don't show urgency
  if (["Finished - Approved", "Finished - Rejected", "Cancelled"].includes(booking.status)) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-muted-foreground">
          {new Date(booking.departureDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs">{config.icon}</span>
        <span className={`text-[11px] font-semibold ${config.color}`}>
          {daysUntilDeparture}d
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        Dep: {new Date(booking.departureDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
      </span>
      <span className="text-[10px] text-muted-foreground">
        DL: {deadline.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sorting
// ─────────────────────────────────────────────

type SortField = "no" | "status" | "pic" | "name" | "country" | "departure" | "agentGroup" | "created";
type SortDirection = "asc" | "desc";

function SortableHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors group/sort"
      onClick={() => onSort(field)}
    >
      <span>{label}</span>
      <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover/sort:opacity-40"}`}>
        {isActive && currentDir === "desc" ? (
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3" />
        ) : (
          <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-3" />
        )}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Filter Popover
// ─────────────────────────────────────────────

function FilterPopover({
  children,
  label,
  activeCount,
}: {
  children: React.ReactNode;
  label: string;
  activeCount: number;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-xs font-medium h-8 px-3 transition-colors ${activeCount > 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"}`}
      >
        <HugeiconsIcon icon={FilterIcon} strokeWidth={2} className="size-3.5" />
        {label}
        {activeCount > 0 && (
          <span className="ml-1 bg-white/20 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
            {activeCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────
// Main Booking Table Component
// ─────────────────────────────────────────────

export function BookingTable() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [agentGroupFilter, setAgentGroupFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });

  // Sort State
  const [sortField, setSortField] = useState<SortField>("no");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Column filter inputs (inline search in header)
  const [colFilters, setColFilters] = useState({
    status: "",
    pic: "",
    name: "",
    country: "",
    city: "",
    service: "",
    agentGroup: "",
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ─── Filtered & Sorted Data ───
  const filteredBookings = useMemo(() => {
    let result = [...mockBookings];

    // Search (global)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.applicant.name.toLowerCase().includes(q) ||
          b.applicant.passportNumber.toLowerCase().includes(q) ||
          b.bookingNumber.toLowerCase().includes(q) ||
          (b.pic && b.pic.toLowerCase().includes(q)) ||
          (b.analyst && b.analyst.toLowerCase().includes(q)) ||
          (b.salesName && b.salesName.toLowerCase().includes(q)) ||
          (b.agentGroupName && b.agentGroupName.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((b) => statusFilter.includes(b.status));
    }

    // Country filter
    if (countryFilter.length > 0) {
      result = result.filter((b) => countryFilter.includes(b.visaPackage.country));
    }

    // City filter
    if (cityFilter.length > 0) {
      result = result.filter((b) => cityFilter.includes(b.applyCity));
    }

    // Service filter
    if (serviceFilter.length > 0) {
      result = result.filter((b) => serviceFilter.includes(b.visaPackage.serviceType));
    }

    // Agent Group filter
    if (agentGroupFilter.length > 0) {
      result = result.filter((b) => agentGroupFilter.includes(b.agentGroup));
    }

    // Date range filter (departure date)
    if (dateRange.from) {
      result = result.filter((b) => b.departureDate >= dateRange.from);
    }
    if (dateRange.to) {
      result = result.filter((b) => b.departureDate <= dateRange.to);
    }

    // Column-level search filters
    if (colFilters.status) {
      result = result.filter((b) =>
        b.status.toLowerCase().includes(colFilters.status.toLowerCase())
      );
    }
    if (colFilters.pic) {
      result = result.filter(
        (b) => b.pic && b.pic.toLowerCase().includes(colFilters.pic.toLowerCase())
      );
    }
    if (colFilters.name) {
      result = result.filter((b) =>
        b.applicant.name.toLowerCase().includes(colFilters.name.toLowerCase())
      );
    }
    if (colFilters.country) {
      result = result.filter((b) =>
        b.visaPackage.country.toLowerCase().includes(colFilters.country.toLowerCase())
      );
    }
    if (colFilters.city) {
      result = result.filter((b) =>
        b.applyCity.toLowerCase().includes(colFilters.city.toLowerCase())
      );
    }
    if (colFilters.service) {
      result = result.filter((b) =>
        b.visaPackage.serviceType.toLowerCase().includes(colFilters.service.toLowerCase())
      );
    }
    if (colFilters.agentGroup) {
      result = result.filter((b) => {
        const groupName = b.agentGroupName || b.agentGroup;
        return groupName.toLowerCase().includes(colFilters.agentGroup.toLowerCase());
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "no":
          cmp = a.bookingNumber.localeCompare(b.bookingNumber);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "pic":
          cmp = (a.pic || "").localeCompare(b.pic || "");
          break;
        case "name":
          cmp = a.applicant.name.localeCompare(b.applicant.name);
          break;
        case "country":
          cmp = a.visaPackage.country.localeCompare(b.visaPackage.country);
          break;
        case "departure":
          cmp = a.departureDate.localeCompare(b.departureDate);
          break;
        case "agentGroup":
          cmp = (a.agentGroupName || a.agentGroup).localeCompare(
            b.agentGroupName || b.agentGroup
          );
          break;
        case "created":
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    searchQuery,
    statusFilter,
    countryFilter,
    cityFilter,
    serviceFilter,
    agentGroupFilter,
    dateRange,
    colFilters,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / pageSize);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection handlers
  const isAllSelected =
    paginatedBookings.length > 0 &&
    paginatedBookings.every((b) => selectedIds.has(b.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const newSet = new Set(selectedIds);
      paginatedBookings.forEach((b) => newSet.delete(b.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      paginatedBookings.forEach((b) => newSet.add(b.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Clear all filters
  const hasActiveFilters =
    searchQuery ||
    statusFilter.length > 0 ||
    countryFilter.length > 0 ||
    cityFilter.length > 0 ||
    serviceFilter.length > 0 ||
    agentGroupFilter.length > 0 ||
    dateRange.from ||
    dateRange.to;

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setCountryFilter([]);
    setCityFilter([]);
    setServiceFilter([]);
    setAgentGroupFilter([]);
    setDateRange({ from: "", to: "" });
    setColFilters({
      status: "",
      pic: "",
      name: "",
      country: "",
      city: "",
      service: "",
      agentGroup: "",
    });
    setCurrentPage(1);
  };

  const toggleFilterItem = <T,>(
    arr: T[],
    item: T,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* ─── Top Bar: Search + Filter Buttons ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Status Filter */}
          <FilterPopover label="Pilih Status" activeCount={statusFilter.length}>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Filter by Status</p>
              {allStatusOptions.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                  <Checkbox
                    checked={statusFilter.includes(status)}
                    onCheckedChange={() => toggleFilterItem(statusFilter, status, setStatusFilter)}
                  />
                  <StatusBadge status={status} />
                </label>
              ))}
            </div>
          </FilterPopover>

          {/* Reset Filter */}
          {hasActiveFilters && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs gap-1.5 rounded-lg"
              onClick={clearAllFilters}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
              Reset Filter
            </Button>
          )}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-1.5">
            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Pilih Range</span>
          </div>
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" className="h-8 text-xs gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5" />
          Add Task
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-lg">
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-3.5" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-lg">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5" />
          Create Bulk
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-lg">
          <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
          Update Task Bulk
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-lg">
          <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="size-3.5" />
          Approve Task
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-lg">
          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5" />
          Pick Task Bulk
        </Button>
      </div>

      {/* ─── Page Size ─── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Show</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            setPageSize(Number(v));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-16 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">entries</span>
      </div>

      {/* ─── Table ─── */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {/* ─ Main Header Row ─ */}
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10 text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12 text-center text-xs font-semibold">
                  <SortableHeader label="No" field="no" currentField={sortField} currentDir={sortDirection} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-xs font-semibold min-w-[130px]">
                  <SortableHeader label="Status" field="status" currentField={sortField} currentDir={sortDirection} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-xs font-semibold min-w-[120px]">Updated By</TableHead>
                <TableHead className="text-xs font-semibold min-w-[110px]">
                  <SortableHeader label="PIC" field="pic" currentField={sortField} currentDir={sortDirection} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-xs font-semibold min-w-[180px]">
                  <SortableHeader label="Name" field="name" currentField={sortField} currentDir={sortDirection} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-xs font-semibold min-w-[110px]">No Passport</TableHead>
                <TableHead className="text-xs font-semibold min-w-[110px]">Analyst</TableHead>
                <TableHead className="text-xs font-semibold min-w-[110px]">
                  <SortableHeader label="Country" field="country" currentField={sortField} currentDir={sortDirection} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-xs font-semibold min-w-[100px]">Visa Type</TableHead>
                <TableHead className="text-xs font-semibold min-w-[100px]">Apply City</TableHead>
                <TableHead className="text-xs font-semibold min-w-[90px]">Services</TableHead>
                <TableHead className="text-xs font-semibold min-w-[120px]">Appointment</TableHead>
                <TableHead className="text-xs font-semibold min-w-[100px]">
                  <SortableHeader label="Deadline" field="departure" currentField={sortField} currentDir={sortDirection} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-xs font-semibold min-w-[130px]">
                  <SortableHeader label="Agent Group" field="agentGroup" currentField={sortField} currentDir={sortDirection} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-xs font-semibold min-w-[80px]">Sales</TableHead>
                <TableHead className="w-10" />
              </TableRow>

              {/* ─ Column Search Row ─ */}
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead />
                <TableHead />
                <TableHead>
                  <Input
                    placeholder="Search status..."
                    value={colFilters.status}
                    onChange={(e) =>
                      setColFilters((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Search Updated By..."
                    value={colFilters.pic}
                    onChange={(e) =>
                      setColFilters((prev) => ({ ...prev, pic: e.target.value }))
                    }
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Search PIC..."
                    value={colFilters.pic}
                    onChange={(e) =>
                      setColFilters((prev) => ({ ...prev, pic: e.target.value }))
                    }
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Filter..."
                    value={colFilters.name}
                    onChange={(e) =>
                      setColFilters((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Filter..."
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Search Analyst..."
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Search Country..."
                    value={colFilters.country}
                    onChange={(e) =>
                      setColFilters((prev) => ({ ...prev, country: e.target.value }))
                    }
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Search Type..."
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Search City..."
                    value={colFilters.city}
                    onChange={(e) =>
                      setColFilters((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    placeholder="Search Service..."
                    value={colFilters.service}
                    onChange={(e) =>
                      setColFilters((prev) => ({ ...prev, service: e.target.value }))
                    }
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead />
                <TableHead />
                <TableHead>
                  <Input
                    placeholder="Search Agent Group..."
                    value={colFilters.agentGroup}
                    onChange={(e) =>
                      setColFilters((prev) => ({ ...prev, agentGroup: e.target.value }))
                    }
                    className="h-6 text-[10px] px-1.5 bg-background/80 border-muted-foreground/20"
                  />
                </TableHead>
                <TableHead />
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={17} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="size-8 opacity-40" />
                      <p className="text-sm">No bookings found</p>
                      <p className="text-xs">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBookings.map((booking, index) => {
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;
                  const isSelected = selectedIds.has(booking.id);

                  return (
                    <TableRow
                      key={booking.id}
                      className={`
                        group/row hover:bg-muted/40 transition-colors cursor-pointer
                        ${isSelected ? "bg-primary/5 hover:bg-primary/10" : ""}
                        ${index % 2 === 0 ? "" : "bg-muted/10"}
                      `}
                    >
                      {/* Checkbox */}
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(booking.id)}
                        />
                      </TableCell>

                      {/* Row Number */}
                      <TableCell className="text-center text-xs font-medium text-muted-foreground">
                        {rowNumber}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={booking.status} />
                      </TableCell>

                      {/* Updated By (PIC) */}
                      <TableCell>
                        <PersonBadge name={booking.pic} />
                      </TableCell>

                      {/* PIC (highlighted) */}
                      <TableCell>
                        <PersonBadge name={booking.pic} highlight />
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <span className="text-xs font-semibold text-foreground">
                          {booking.applicant.name}
                        </span>
                      </TableCell>

                      {/* Passport */}
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {booking.applicant.passportNumber}
                        </span>
                      </TableCell>

                      {/* Analyst */}
                      <TableCell>
                        <PersonBadge name={booking.analyst} />
                      </TableCell>

                      {/* Country */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{countryFlags[booking.visaPackage.country] || "🏳️"}</span>
                          <span className="text-xs font-medium">{booking.visaPackage.country.toUpperCase()}</span>
                        </div>
                      </TableCell>

                      {/* Visa Type */}
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {booking.visaPackage.visaType} Tourist
                        </span>
                      </TableCell>

                      {/* Apply City */}
                      <TableCell>
                        <span className="text-xs">{booking.applyCity}</span>
                      </TableCell>

                      {/* Services */}
                      <TableCell>
                        <Badge variant={booking.visaPackage.serviceType === "Standard" ? "outline" : "default"} className="text-[10px]">
                          {booking.visaPackage.serviceType}
                        </Badge>
                      </TableCell>

                      {/* Appointment */}
                      <TableCell>
                        <AppointmentBadge status={booking.appointmentStatus} date={booking.appointmentDate} />
                      </TableCell>

                      {/* Deadline */}
                      <TableCell>
                        <DeadlineIndicator booking={booking} />
                      </TableCell>

                      {/* Agent Group */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium">{booking.agentGroup}</span>
                          {booking.agentGroupName && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {booking.agentGroupName}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Sales */}
                      <TableCell>
                        <span className="text-xs">{booking.salesName}</span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Pagination ─── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filteredBookings.length > 0
            ? `${(currentPage - 1) * pageSize + 1} sampai ${Math.min(
                currentPage * pageSize,
                filteredBookings.length
              )} dari ${filteredBookings.length} data`
            : "No data"}
        </p>

        <div className="flex items-center gap-1">
          {/* First & Prev */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
          >
            <span className="text-[10px] font-bold">|‹</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3.5" />
          </Button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="icon"
                className="h-7 w-7 text-xs"
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          {totalPages > 5 && (
            <span className="text-xs text-muted-foreground px-1">...</span>
          )}

          {/* Next & Last */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            <span className="text-[10px] font-bold">›|</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
