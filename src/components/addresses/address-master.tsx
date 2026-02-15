"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  Tick02Icon,
  Cancel01Icon,
  PlusSignIcon,
  Search01Icon,
  SortingAZ01Icon,
  SortingZA01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Location01Icon,
  GlobalIcon,
} from "@hugeicons/core-free-icons";
import { TIMEZONES } from "@/lib/data/mock-addresses";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type Address,
} from "@/lib/supabase/addresses";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type SortField = "name" | "code" | "level";
type SortDirection = "asc" | "desc";

export function AddressMaster() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<
    "all" | "country" | "city"
  >("all");
  const [filterParent, setFilterParent] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch addresses from Supabase on mount
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Address>>({});

  // Inline add state
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Address>>({
    name: "",
    code: "",
    parent_id: null,
    postal_code: "",
    timezone: "",
    description: "",
    flag: "",
  });

  // Get all countries for parent selection
  const countries = useMemo(
    () => addresses.filter((a) => a.parent_id === null),
    [addresses]
  );

  // Get parent name by id
  const getParentName = useCallback(
    (parentId: string | null) => {
      if (!parentId) return "-";
      const parent = addresses.find((a) => a.id === parentId);
      return parent ? parent.name : "-";
    },
    [addresses]
  );

  // Get level label
  const getLevel = (address: Address) => {
    return address.parent_id === null ? "Country" : "City";
  };

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = [...addresses];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }

    // Level filter
    if (filterLevel === "country") {
      result = result.filter((a) => a.parent_id === null);
    } else if (filterLevel === "city") {
      result = result.filter((a) => a.parent_id !== null);
    }

    // Parent filter
    if (filterParent !== "all") {
      result = result.filter(
        (a) => a.parent_id === filterParent || a.id === filterParent
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "code") {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === "level") {
        const levelA = a.parent_id === null ? "Country" : "City";
        const levelB = b.parent_id === null ? "Country" : "City";
        comparison = levelA.localeCompare(levelB);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [addresses, searchQuery, filterLevel, filterParent, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  // Add handlers
  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setAddForm({
      name: "",
      code: "",
      parent_id: null,
      postal_code: "",
      timezone: "",
      description: "",
      flag: "",
    });
  };

  const handleSaveAdd = async () => {
    if (!addForm.name || !addForm.code) return;

    try {
      setSaving(true);
      await createAddress({
        name: addForm.name || "",
        code: addForm.code || "",
        parent_id: addForm.parent_id || null,
        postal_code: addForm.postal_code || "-",
        timezone: addForm.timezone || "",
        description: addForm.description || "",
        flag: addForm.parent_id === null ? addForm.flag || "" : null,
      });
      await fetchAddresses();
      setIsAdding(false);
      setAddForm({});
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to add address:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setAddForm({});
  };

  // Edit handlers
  const handleStartEdit = (address: Address) => {
    setEditingId(address.id);
    setIsAdding(false);
    setEditForm({ ...address });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name || !editForm.code) return;

    try {
      setSaving(true);
      await updateAddress(editingId, {
        name: editForm.name,
        code: editForm.code,
        parent_id: editForm.parent_id,
        postal_code: editForm.postal_code,
        timezone: editForm.timezone,
        description: editForm.description,
        flag: (editForm.parent_id ?? null) === null ? editForm.flag : null,
      });
      await fetchAddresses();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error("Failed to update address:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      await deleteAddress(id);
      await fetchAddresses();
    } catch (err) {
      console.error("Failed to delete address:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Address Master</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage city, country, and province data.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search */}
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
            />
            <Input
              placeholder="Search addresses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 w-[200px]"
            />
          </div>

          {/* Level Filter */}
          <Select
            value={filterLevel}
            onValueChange={(val) => {
              if (!val) return;
              setFilterLevel(val as "all" | "country" | "city");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>

          {/* Parent Filter */}
          <Select
            value={filterParent}
            onValueChange={(val) => {
              if (!val) return;
              setFilterParent(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Parents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parents</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.flag && `${c.flag} `}{c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={`${sortField}_${sortDirection}`}
            onValueChange={(val) => {
              if (!val) return;
              const [field, dir] = val.split("_");
              setSortField(field as SortField);
              setSortDirection(dir as SortDirection);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="code_asc">Code (A-Z)</SelectItem>
              <SelectItem value="code_desc">Code (Z-A)</SelectItem>
              <SelectItem value="level_asc">Level (A-Z)</SelectItem>
              <SelectItem value="level_desc">Level (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          {/* Per Page */}
          <Select
            value={String(perPage)}
            onValueChange={(val) => {
              if (!val) return;
              setPerPage(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Button */}
        <Button onClick={handleStartAdd} disabled={isAdding}>
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="mr-2 size-4"
          />
          Add Address
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[160px]"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                  {sortField === "name" && (
                    <HugeiconsIcon
                      icon={
                        sortDirection === "asc"
                          ? SortingAZ01Icon
                          : SortingZA01Icon
                      }
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[100px]"
                onClick={() => toggleSort("code")}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Code
                  {sortField === "code" && (
                    <HugeiconsIcon
                      icon={
                        sortDirection === "asc"
                          ? SortingAZ01Icon
                          : SortingZA01Icon
                      }
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[90px]"
                onClick={() => toggleSort("level")}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Level
                  {sortField === "level" && (
                    <HugeiconsIcon
                      icon={
                        sortDirection === "asc"
                          ? SortingAZ01Icon
                          : SortingZA01Icon
                      }
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  )}
                </div>
              </TableHead>
              <TableHead className="min-w-[160px]">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Parent
                </div>
              </TableHead>
              <TableHead className="min-w-[100px]">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Postal Code
                </div>
              </TableHead>
              <TableHead className="min-w-[180px]">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Timezone
                </div>
              </TableHead>
              <TableHead className="min-w-[160px]">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </div>
              </TableHead>
              <TableHead className="text-right min-w-[120px]">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Inline Add Row */}
            {isAdding && (
              <TableRow className="bg-primary/5 hover:bg-primary/5 border-l-2 border-l-primary animate-in slide-in-from-top-2 duration-200">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* Flag input - only when it's a country (no parent) */}
                    {addForm.parent_id === null && (
                      <Input
                        placeholder="🏳️"
                        value={addForm.flag || ""}
                        onChange={(e) =>
                          setAddForm((prev) => ({
                            ...prev,
                            flag: e.target.value,
                          }))
                        }
                        className="w-[50px] text-center text-base"
                        title="Country flag emoji"
                      />
                    )}
                    <Input
                      placeholder="Name"
                      value={addForm.name || ""}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="min-w-[100px]"
                      autoFocus
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Code"
                    value={addForm.code || ""}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        code: e.target.value,
                      }))
                    }
                    className="w-[90px]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={addForm.parent_id === null ? "country" : "city"}
                    onValueChange={(val) => {
                      setAddForm((prev) => ({
                        ...prev,
                        parent_id: val === "country" ? null : prev.parent_id || "",
                      }));
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="country">Country</SelectItem>
                      <SelectItem value="city">City</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {addForm.parent_id !== null ? (
                    <Select
                      value={addForm.parent_id || ""}
                      onValueChange={(val) => {
                        setAddForm((prev) => ({
                          ...prev,
                          parent_id: val,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select Parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.flag && `${c.flag} `}{c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Postal"
                    value={addForm.postal_code || ""}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                    className="w-[80px]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={addForm.timezone || ""}
                    onValueChange={(val) => {
                      if (!val) return;
                      setAddForm((prev) => ({
                        ...prev,
                        timezone: val as string,
                      }));
                    }}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Description"
                    value={addForm.description || ""}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="min-w-[120px]"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      onClick={handleSaveAdd}
                      disabled={!addForm.name || !addForm.code}
                      className="h-7 gap-1"
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className="size-3.5"
                      />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelAdd}
                      className="h-7 gap-1"
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        strokeWidth={2}
                        className="size-3.5"
                      />
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data Rows */}
            {paginatedData.map((address) => {
              const isEditing = editingId === address.id;
              const level = getLevel(address);

              if (isEditing) {
                return (
                  <TableRow
                    key={address.id}
                    className="bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50/80 dark:hover:bg-amber-900/15 border-l-2 border-l-amber-500 animate-in fade-in duration-200"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Flag input for Country editing */}
                        {(editForm.parent_id ?? address.parent_id) === null && (
                          <Input
                            placeholder="🏳️"
                            value={editForm.flag ?? address.flag ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                flag: e.target.value,
                              }))
                            }
                            className="w-[50px] text-center text-base"
                            title="Country flag emoji"
                          />
                        )}
                        <Input
                          value={editForm.name ?? ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="min-w-[100px]"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editForm.code ?? ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            code: e.target.value,
                          }))
                        }
                        className="w-[90px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={
                          (editForm.parent_id ?? address.parent_id) === null
                            ? "country"
                            : "city"
                        }
                        onValueChange={(val) => {
                          setEditForm((prev) => ({
                            ...prev,
                            parent_id:
                              val === "country"
                                ? null
                                : prev.parent_id || "",
                          }));
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="country">Country</SelectItem>
                          <SelectItem value="city">City</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {(editForm.parent_id ?? address.parent_id) !== null ? (
                        <Select
                          value={editForm.parent_id ?? address.parent_id ?? ""}
                          onValueChange={(val) => {
                            setEditForm((prev) => ({
                              ...prev,
                              parent_id: val,
                            }));
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select Parent" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries
                              .filter((c) => c.id !== address.id)
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.flag && `${c.flag} `}{c.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editForm.postal_code ?? ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            postal_code: e.target.value,
                          }))
                        }
                        className="w-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={editForm.timezone ?? address.timezone ?? ""}
                        onValueChange={(val) => {
                          if (!val) return;
                          setEditForm((prev) => ({
                            ...prev,
                            timezone: val as string,
                          }));
                        }}
                      >
                        <SelectTrigger className="w-[170px]">
                          <SelectValue placeholder="Timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editForm.description ?? ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="min-w-[120px]"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={!editForm.name || !editForm.code}
                          className="h-7 gap-1"
                        >
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            strokeWidth={2}
                            className="size-3.5"
                          />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-7 gap-1"
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={2}
                            className="size-3.5"
                          />
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow
                  key={address.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {level === "Country" && address.flag && (
                        <span className="text-base leading-none">
                          {address.flag}
                        </span>
                      )}
                      {level === "City" && (
                        <HugeiconsIcon
                          icon={Location01Icon}
                          strokeWidth={2}
                          className="size-3.5 text-muted-foreground"
                        />
                      )}
                      {address.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {address.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={level === "Country" ? "default" : "secondary"}
                      className="text-[10px] font-medium px-2"
                    >
                      {level === "Country" && (
                        <HugeiconsIcon
                          icon={GlobalIcon}
                          strokeWidth={2}
                          className="size-3 mr-1"
                        />
                      )}
                      {level === "City" && (
                        <HugeiconsIcon
                          icon={Location01Icon}
                          strokeWidth={2}
                          className="size-3 mr-1"
                        />
                      )}
                      {level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {address.parent_id ? (
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const parent = addresses.find(
                            (a) => a.id === address.parent_id
                          );
                          return (
                            <>
                              {parent?.flag && (
                                <span className="text-sm">
                                  {parent.flag}
                                </span>
                              )}
                              <span className="text-sm">
                                {getParentName(address.parent_id)}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{address.postal_code}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {address.timezone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {address.description}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[140px]">
                        <DropdownMenuItem
                          onClick={() => handleStartEdit(address)}
                        >
                          <HugeiconsIcon
                            icon={Edit01Icon}
                            strokeWidth={2}
                            className="size-4 mr-2"
                          />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(address.id)}
                        >
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            strokeWidth={2}
                            className="size-4 mr-2"
                          />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Empty state */}
            {paginatedData.length === 0 && !isAdding && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      strokeWidth={1.5}
                      className="size-10 opacity-30"
                    />
                    <p className="text-sm">No addresses found</p>
                    <p className="text-xs">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredData.length > 0 ? (currentPage - 1) * perPage + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min(currentPage * perPage, filteredData.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {filteredData.length}
          </span>{" "}
          entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-7 gap-1"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-7 w-7 p-0"
                >
                  {page}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-muted-foreground text-xs px-1">...</span>
                <Button
                  variant={
                    totalPages === currentPage ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="h-7 w-7 p-0"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-7 gap-1"
          >
            Next
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
