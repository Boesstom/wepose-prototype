
"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Settings01Icon,
  ArrowRight01Icon,
  Money03Icon,
  UserGroupIcon,
  FilterHorizontalIcon, 
  GlobalIcon, 
  PassportIcon,
  Cancel01Icon 
} from "@hugeicons/core-free-icons";
import { Printer } from "lucide-react";
import { getPricingDashboardData, updateVisaPrice, type VisaPricingView, bulkUpdatePrices, searchAgents, bulkUpsertAgentSpecialPrice, bulkUpsertAgentSpecialPrices, bulkUpsertVisaCampaigns, getAgentAllSpecialPrices } from "@/lib/supabase/pricing";
import { SpecialPricingSidebar } from "./special-pricing-sidebar";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";

export function PricingDashboard() {
  const [visas, setVisas] = useState<VisaPricingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisas, setSelectedVisas] = useState<Set<string>>(new Set());
  
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisa, setSidebarVisa] = useState<{ id: string; name: string } | null>(null);

  // Bulk Update State
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<"price" | "price_agent">("price");
  const [bulkType, setBulkType] = useState<"increase" | "decrease" | "set">("increase");
  const [bulkAmount, setBulkAmount] = useState<number>(0);

  // Agent Tier (Bulk Special Price) State
  const [agentTierOpen, setAgentTierOpen] = useState(false);
  const [tierAgentId, setTierAgentId] = useState<string>("");
  const [tierAgentQuery, setTierAgentQuery] = useState("");
  const [tierAgentResults, setTierAgentResults] = useState<{ id: string; name: string; company_name?: string }[]>([]);
  const [tierUpdates, setTierUpdates] = useState<Record<string, { price: number; note: string }>>({});
  const [bulkGlobalAmount, setBulkGlobalAmount] = useState<number>(0);
  const [bulkGlobalAction, setBulkGlobalAction] = useState<"set" | "discount_amount">("set");
  
  const debouncedTierQuery = useDebounce(tierAgentQuery, 300);

  // Initialize tier updates when dialog opens
  useEffect(() => {
      if (agentTierOpen && selectedVisas.size > 0) {
          const updates: Record<string, { price: number; note: string }> = {};
          selectedVisas.forEach(id => {
              const v = visas.find(v => v.id === id);
              if (v) {
                  // Default to retail price or 0? 0 forces user to input.
                  updates[id] = { price: 0, note: "" };
              }
          });
          setTierUpdates(updates);
      }
  }, [agentTierOpen, selectedVisas]); 

  // Bulk Promo / War Visa State
  const [promoBulkOpen, setPromoBulkOpen] = useState(false);
  const [promoName, setPromoName] = useState("");
  const [promoDateRange, setPromoDateRange] = useState<{ start?: string; end?: string }>({});
  const [promoRules, setPromoRules] = useState<{ min: number; max: number; price: number }[]>([{ min: 1, max: 999, price: 0 }]);

  const handleBulkCampaignCreate = async () => {
      if(selectedVisas.size === 0) {
          toast.error("Please select visas first");
          return;
      }
      if(!promoName.trim()) {
          toast.error("Please enter a campaign name");
          return;
      }
      if(promoRules.some(r => r.price <= 0)) {
          toast.error("Please set valid prices for all rules");
          return;
      }

      const campaigns = Array.from(selectedVisas).map(visaId => ({
          visa_id: visaId,
          name: promoName,
          start_date: promoDateRange.start,
          end_date: promoDateRange.end,
          is_active: true,
          rules: promoRules
      }));

      try {
          await bulkUpsertVisaCampaigns(campaigns);
          toast.success(`Created campaign "${promoName}" for ${selectedVisas.size} visas`);
          setPromoBulkOpen(false);
          setPromoName("");
          setPromoDateRange({});
          setPromoRules([{ min: 1, max: 999, price: 0 }]);
          setSelectedVisas(new Set());
          loadData();
      } catch (error: any) {
          const errString = JSON.stringify(error, Object.getOwnPropertyNames(error));
          toast.error(`Failed to create bulk campaigns: ${error.message || "Unknown error"}`);
          console.error("Bulk Campaign Creation Error (Detailed):", errString, error);
      }
  }

  const addPromoRule = () => {
      setPromoRules([...promoRules, { min: 1, max: 999, price: 0 }]);
  }

  const removePromoRule = (index: number) => {
      if(promoRules.length === 1) return;
      setPromoRules(promoRules.filter((_, i) => i !== index));
  }

  const updatePromoRule = (index: number, field: keyof typeof promoRules[0], value: number) => {
      const newRules = [...promoRules];
      newRules[index] = { ...newRules[index], [field]: value };
      setPromoRules(newRules);
  } 

  // Print State
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
      showRetail: true,
      showAgentStandard: true,
      showPromo: false,
      agentId: "",
      agentName: ""
  });
  const [printAgentQuery, setPrintAgentQuery] = useState("");
  const [printAgentResults, setPrintAgentResults] = useState<{ id: string; name: string; company_name?: string }[]>([]);
  const [printAgentData, setPrintAgentData] = useState<Record<string, { price: number; note?: string }>>({});
  const debouncedPrintAgentQuery = useDebounce(printAgentQuery, 300);

  // Print Effects
  useEffect(() => {
    if (debouncedPrintAgentQuery) {
        searchAgents(debouncedPrintAgentQuery).then((res) => setPrintAgentResults(res || []));
    } else {
        setPrintAgentResults([]);
    }
  }, [debouncedPrintAgentQuery]);

  useEffect(() => {
    if (printConfig.agentId) {
        getAgentAllSpecialPrices(printConfig.agentId).then(data => {
            const map: Record<string, { price: number; note?: string }> = {};
            data.forEach(item => {
                map[item.visa_id] = { price: item.price, note: item.notes };
            });
            setPrintAgentData(map);
        });
    } else {
        setPrintAgentData({});
    }
  }, [printConfig.agentId]);

  const handlePrint = () => {
     const printArea = document.getElementById("print-area");
     if (!printArea) return;
     
     const myWindow = window.open("", "PRINT", "height=600,width=800");
     if (myWindow) {
         myWindow.document.write("<html><head><title>Price List</title>");
         myWindow.document.write("<style>body{font-family:sans-serif;padding:20px;} h1{margin-bottom:10px;} table{width:100%;border-collapse:collapse;font-size:12px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f9f9f9;} .badge{display:inline-block;padding:2px 6px;border-radius:4px;background:#eee;font-size:10px;margin-right:4px;} .agent-price{font-weight:bold;color:#000;} .note{font-size:10px;color:#666;font-style:italic;display:block;}</style>");
         myWindow.document.write("</head><body >");
         myWindow.document.write(printArea.innerHTML);
         myWindow.document.write("</body></html>");
         myWindow.document.close(); // necessary for IE >= 10
         myWindow.focus(); // necessary for IE >= 10*/
         
         // Timeout to allow styles to load
         setTimeout(() => {
            myWindow.print();
            myWindow.close();
         }, 500);
     }
  };


  // Advanced Filters State
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  // Agent Search Effect for Bulk Dialog
  useEffect(() => {
    if (debouncedTierQuery) {
        searchAgents(debouncedTierQuery).then((res) => setTierAgentResults(res || []));
    } else {
        setTierAgentResults([]);
    }
  }, [debouncedTierQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPricingDashboardData();
      setVisas(data || []);
    } catch (error) {
      toast.error("Failed to load pricing data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique options for filters
  const { countryOptions, typeOptions } = useMemo(() => {
    const countrySet = new Set<string>();
    const typeSet = new Set<string>();
    
    visas.forEach(v => {
      if(v.country) countrySet.add(v.country);
      if(v.type) typeSet.add(v.type);
    });

    return {
      countryOptions: Array.from(countrySet).sort().map(c => ({ label: c, value: c })),
      typeOptions: Array.from(typeSet).sort().map(t => ({ label: t, value: t })),
    };
  }, [visas]);

  // Filter Logic
  const filteredVisas = useMemo(() => {
    return visas.filter((visa) => {
      // Search
      const searchContent = `${visa.name} ${visa.country} ${visa.type}`.toLowerCase();
      if (searchQuery && !searchContent.includes(searchQuery.toLowerCase())) return false;

      // Multi-select filters
      if (selectedCountries.size > 0 && !selectedCountries.has(visa.country)) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(visa.type)) return false;

      // Price Range
      const pMin = priceMin ? parseFloat(priceMin) : 0;
      const pMax = priceMax ? parseFloat(priceMax) : Infinity;
      if (visa.price < pMin) return false;
      if (priceMax && visa.price > pMax) return false;

      return true;
    });
  }, [visas, searchQuery, selectedCountries, selectedTypes, priceMin, priceMax]);

  const toggleFilter = (set: Set<string>, value: string, setter: (newSet: Set<string>) => void) => {
    const newSet = new Set(set);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setter(newSet);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCountries(new Set());
    setSelectedTypes(new Set());
    setPriceMin("");
    setPriceMax("");
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedCountries.size > 0 || 
    selectedTypes.size > 0 || 
    priceMin ||
    priceMax;


  // Inline Edit Handlers
  const handlePriceUpdate = async (id: string, field: "price" | "price_agent", value: string) => {
    const rawValue = value.replace(/[^0-9]/g, "");
    if (!rawValue) return;
    const numValue = parseInt(rawValue);
    
    // Update local state optimistic
    setVisas((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field === "price" ? "price" : "price_agent"]: numValue } : v))
    );

    try {
      if (field === "price") {
          await updateVisaPrice(id, { price: numValue });
      } else {
          await updateVisaPrice(id, { price_agent: numValue });
      }
      toast.success("Price updated");
    } catch (error) {
      toast.error("Failed to update price");
      loadData(); // Revert
    }
  };

  const handleBulkUpdate = async () => {
      if(selectedVisas.size === 0 || bulkAmount <= 0) return;
      try {
          await bulkUpdatePrices(Array.from(selectedVisas), bulkAmount, bulkType, bulkTarget);
          toast.success(`Updated ${selectedVisas.size} visas`);
          setBulkDialogOpen(false);
          setSelectedVisas(new Set());
          setBulkAmount(0);
          loadData();
      } catch (error) {
          toast.error("Failed to bulk update");
      }
  }

  const handleBulkAgentTierUpdate = async () => {
      if(selectedVisas.size === 0) {
          toast.error("Please select visas first");
          return;
      }
      if(!tierAgentId) {
          toast.error("Please select an agent");
          return;
      }

      // Convert updates map to array
      const items = Object.entries(tierUpdates).map(([visaId, data]) => ({
          visa_id: visaId,
          agent_id: tierAgentId,
          price: data.price,
          notes: data.note
      })).filter(item => item.price > 0); // Only save valid prices

      if (items.length === 0) {
          toast.error("Please set at least one valid price (> 0)");
          return;
      }

      try {
          await bulkUpsertAgentSpecialPrices(items);
          toast.success(`Updated special prices for ${items.length} visas`);
          setAgentTierOpen(false);
          setTierAgentId("");
          setTierAgentQuery("");
          setTierUpdates({});
          setBulkGlobalAmount(0);
          setSelectedVisas(new Set());
          loadData();
      } catch (error) {
          toast.error("Failed to update agent prices");
          console.error(error);
      }
  }

  const applyGlobalBulk = () => {
      if (bulkGlobalAmount <= 0) return;

      setTierUpdates(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(visaId => {
              const visa = visas.find(v => v.id === visaId);
              if (!visa) return;

              let newPrice = 0;
              if (bulkGlobalAction === "set") {
                  newPrice = bulkGlobalAmount;
              } else if (bulkGlobalAction === "discount_amount") {
                  newPrice = Math.max(0, visa.price - bulkGlobalAmount);
              }
              
              next[visaId] = { ...next[visaId], price: newPrice };
          });
          return next;
      });
  }

  const updateTierItem = (visaId: string, field: "price" | "note", value: any) => {
      setTierUpdates(prev => ({
          ...prev,
          [visaId]: { ...prev[visaId], [field]: value }
      }));
  }

  const toggleSelectAll = () => {
      if (selectedVisas.size === filteredVisas.length) {
          setSelectedVisas(new Set());
      } else {
          setSelectedVisas(new Set(filteredVisas.map(v => v.id)));
      }
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-1">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {/* Search Input */}
          <div className="relative w-full md:w-64 shrink-0">
             <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={2}
                  className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
                />
            <Input
              placeholder="Search..."
              className="pl-9 h-8 w-full transition-all focus:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block" />

          {/* Filters */}
          <div className="flex items-center gap-2">
            <MultiSelectFilter
              title="Country"
              options={countryOptions}
              selectedValues={selectedCountries}
              onSelect={(val) => toggleFilter(selectedCountries, val, setSelectedCountries)}
              onClear={() => setSelectedCountries(new Set())}
              icon={GlobalIcon}
            />
            <MultiSelectFilter
              title="Type"
              options={typeOptions}
              selectedValues={selectedTypes}
              onSelect={(val) => toggleFilter(selectedTypes, val, setSelectedTypes)}
              onClear={() => setSelectedTypes(new Set())}
              icon={PassportIcon}
            />

            {/* Price Range Filter */}
            <Popover>
              <PopoverTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 border-dashed")}>
                  <HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="mr-2 size-3.5" />
                  Price Range
                  {(priceMin || priceMax) && (
                     <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                       <Badge variant="secondary" className="rounded-sm px-1 font-normal">Active</Badge>
                     </>
                  )}
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Retail Price Range</h4>
                    <p className="text-xs text-muted-foreground">
                      Filter by Retail (FIT) price.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="minPrice">Min</Label>
                      <Input
                        id="minPrice"
                        type="number"
                        placeholder="0"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxPrice">Max</Label>
                      <Input
                        id="maxPrice"
                        type="number"
                        placeholder="No limit"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 lg:px-3 text-muted-foreground"
                onClick={clearFilters}
              >
                Reset
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="ml-2 size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions (Right Side) */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setPrintDialogOpen(true)}>
             <Printer className="size-3.5" />
             Print PDF
          </Button>
          {selectedVisas.size > 0 && (
              <>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 text-primary border-primary/20 bg-primary/5"
                    onClick={() => setBulkDialogOpen(true)}
                >
                    <HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="size-4" />
                    Update {selectedVisas.size} Selected
                </Button>
                <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 gap-2"
                      onClick={() => setAgentTierOpen(true)}
                >
                      <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />
                      Set Agent Price ({selectedVisas.size})
                </Button>
                <Button 
                    variant="default" 
                    size="sm" 
                    className="h-8 gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => setPromoBulkOpen(true)}
                >
                    <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} className="size-4" />
                    Create Promo ({selectedVisas.size})
                </Button>
              </>
          )}
        </div>
      </div>

       {/* Results Summary */}
       <div className="px-1 text-sm text-muted-foreground mb-4">
          Showing {filteredVisas.length} visa{filteredVisas.length !== 1 ? "s" : ""}
          {filteredVisas.length !== visas.length && ` (filtered from ${visas.length})`}
       </div>

      {/* Main Table */}
      <div className="rounded-md border bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 h-10">
              <TableHead className="w-[40px] pl-4">
                <Checkbox 
                    checked={selectedVisas.size === filteredVisas.length && filteredVisas.length > 0}
                    onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="py-3">Visa Name</TableHead>
              <TableHead className="py-3">Country</TableHead>
              <TableHead className="w-[200px] py-3">FIT Price (Retail)</TableHead>
              <TableHead className="w-[200px] py-3">Agent Standard</TableHead>
              <TableHead className="py-3">Special Rules</TableHead>
              <TableHead className="w-[50px] py-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading prices...</TableCell>
                </TableRow>
            ) : filteredVisas.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No visas found matching filters.</TableCell>
                </TableRow>
            ) : (
                filteredVisas.map((visa) => (
                    <TableRow key={visa.id} className="group hover:bg-muted/30 transition-colors h-14">
                        <TableCell className="pl-4">
                            <Checkbox 
                                checked={selectedVisas.has(visa.id)}
                                onCheckedChange={(checked) => {
                                    const next = new Set(selectedVisas);
                                    if(checked) next.add(visa.id);
                                    else next.delete(visa.id);
                                    setSelectedVisas(next);
                                }}
                            />
                        </TableCell>
                        <TableCell className="font-medium">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm">{visa.name}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground border-muted-foreground/30">{visa.type}</Badge>
                                    {visa.active_campaign_count > 0 && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
                                            Promo Active
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{visa.country}</TableCell>
                        
                        {/* Inline Editable - FIT Price */}
                        <TableCell>
                            <div className="relative group/input max-w-[160px]">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none font-medium">Rp</div>
                                <Input 
                                    className="pl-9 h-9 font-mono text-sm border-transparent bg-muted/30 hover:bg-muted focus:bg-background focus:border-input transition-all ring-0 focus-visible:ring-1 focus-visible:ring-primary/30"
                                    defaultValue={visa.price}
                                    onBlur={(e) => handlePriceUpdate(visa.id, "price", e.target.value)}
                                />
                            </div>
                        </TableCell>

                        {/* Inline Editable - Agent Price */}
                        <TableCell>
                            <div className="relative group/input max-w-[160px]">
                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none font-medium ${!visa.priceAgent ? "opacity-50" : "text-muted-foreground"}`}>Rp</div>
                                <Input 
                                    className={`pl-9 h-9 font-mono text-sm border-transparent bg-muted/30 hover:bg-muted focus:bg-background focus:border-input transition-all ring-0 focus-visible:ring-1 focus-visible:ring-primary/30 ${!visa.priceAgent ? "text-muted-foreground italic" : ""}`}
                                    placeholder="Set Price"
                                    defaultValue={visa.priceAgent || ""}
                                    onBlur={(e) => handlePriceUpdate(visa.id, "price_agent", e.target.value)}
                                />
                            </div>
                        </TableCell>

                        {/* Special Rules Indicator */}
                        <TableCell>
                            <div 
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-primary/5 cursor-pointer transition-colors border border-transparent hover:border-primary/20 group/rules"
                                onClick={() => {
                                    setSidebarVisa({ id: visa.id, name: visa.name });
                                    setSidebarOpen(true);
                                }}
                            >
                                <div className={`flex items-center justify-center size-5 rounded-full text-[10px] font-bold shadow-sm ${visa.special_price_count > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    {visa.special_price_count}
                                </div>
                                <span className="text-xs text-muted-foreground group-hover/rules:text-primary font-medium">Agents</span>
                                <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground opacity-0 group-hover/rules:opacity-100 transition-opacity ml-1" />
                            </div>
                        </TableCell>

                        <TableCell>
                           <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100 transition-opacity">
                                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                           </Button> 
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Special Pricing Sidebar */}
      <SpecialPricingSidebar 
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
        visa={sidebarVisa}
        onUpdate={loadData}
      />

      {/* Bulk Update Dialog (Standard) */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Bulk Update Prices</DialogTitle>
                  <DialogDescription>
                      Update prices for {selectedVisas.size} selected visas using a fixed amount.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="space-y-4">
                      {/* Target Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Target Price</label>
                        <Select value={bulkTarget} onValueChange={(v) => { if(v) setBulkTarget(v as "price" | "price_agent") }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="price">Retail Price (FIT)</SelectItem>
                                <SelectItem value="price_agent">Agent Standard Price</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>

                      {/* Action & Amount */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Action</label>
                        <div className="flex items-center gap-3">
                            <Select value={bulkType} onValueChange={(v) => { if(v) setBulkType(v as any) }}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="increase">Increase by</SelectItem>
                                    <SelectItem value="decrease">Decrease by</SelectItem>
                                    <SelectItem value="set">Set Price To</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">Rp</span>
                                <Input 
                                    type="number" 
                                    className="pl-9" 
                                    placeholder="Amount"
                                    value={bulkAmount || ""}
                                    onChange={(e) => setBulkAmount(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                      </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md border border-dashed">
                    {bulkType === "set" 
                        ? `This will set the ${bulkTarget === 'price' ? 'Retail (FIT)' : 'Agent Standard'} price to the specified amount for all selected visas.` 
                        : `This will ${bulkType} the ${bulkTarget === 'price' ? 'Retail (FIT)' : 'Agent Standard'} price by the specified amount.`}
                  </p>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleBulkUpdate}>Apply Update</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Bulk Agent Tier Dialog */}
      <Dialog open={agentTierOpen} onOpenChange={setAgentTierOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
              <DialogHeader className="px-6 py-4 border-b">
                  <DialogTitle>Set Bulk Agent Price</DialogTitle>
                  <DialogDescription>
                      Assign special prices for {selectedVisas.size} selected visas.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {/* Step 1: Select Agent */}
                  <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                             <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-xs">1</span>
                             Select Agent
                        </Label>
                        <div className="relative max-w-md">
                            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search agent..." 
                                className="pl-9"
                                value={tierAgentQuery}
                                onChange={(e) => {
                                    setTierAgentQuery(e.target.value);
                                    if(tierAgentId) setTierAgentId(""); 
                                }}
                            />
                            {tierAgentResults.length > 0 && !tierAgentId && (
                                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                                    {tierAgentResults.map(agent => (
                                        <div 
                                            key={agent.id}
                                            className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex flex-col"
                                            onClick={() => {
                                                setTierAgentQuery(agent.name);
                                                setTierAgentId(agent.id);
                                                setTierAgentResults([]);
                                            }}
                                        >
                                            <span className="font-medium">{agent.name}</span>
                                            {agent.company_name && <span className="text-xs text-muted-foreground">{agent.company_name}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                  </div>

                  <Separator />

                  {/* Step 2: Set Prices */}
                   <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-xs">2</span>
                                Configure Prices
                            </Label>
                            
                            {/* Global Bulk Tool */}
                            <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-lg border border-dashed">
                                <span className="text-xs font-medium text-muted-foreground px-1">Bulk Apply:</span>
                                <Select value={bulkGlobalAction} onValueChange={(v: any) => setBulkGlobalAction(v)}>
                                    <SelectTrigger className="h-7 text-xs w-[130px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="set">Set Fixed Price</SelectItem>
                                        <SelectItem value="discount_amount">Discount Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-24">
                                     <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">Rp</span>
                                     <Input 
                                        type="number"
                                        className="h-7 text-xs pl-6"
                                        placeholder="0"
                                        value={bulkGlobalAmount || ""}
                                        onChange={(e) => setBulkGlobalAmount(parseFloat(e.target.value))}
                                     />
                                </div>
                                <Button size="sm" className="h-7 text-xs" onClick={applyGlobalBulk}>Apply</Button>
                            </div>
                        </div>

                        <div className="border rounded-md overflow-hidden">
                             <Table>
                                 <TableHeader>
                                     <TableRow className="bg-muted/30">
                                         <TableHead className="w-[40%]">Visa</TableHead>
                                         <TableHead className="w-[20%]">Retail Price</TableHead>
                                         <TableHead className="w-[25%] bg-primary/5">Special Price</TableHead>
                                         <TableHead className="w-[15%]">Note</TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {Array.from(selectedVisas).map(visaId => {
                                         const visa = visas.find(v => v.id === visaId);
                                         if(!visa) return null;
                                         const update = tierUpdates[visaId] || { price: 0, note: "" };

                                         return (
                                             <TableRow key={visaId}>
                                                 <TableCell>
                                                     <div className="font-medium text-sm">{visa.name}</div>
                                                     <div className="text-xs text-muted-foreground">{visa.country}</div>
                                                 </TableCell>
                                                 <TableCell className="text-sm font-mono text-muted-foreground">
                                                     {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(visa.price)}
                                                 </TableCell>
                                                 <TableCell className="bg-primary/5">
                                                     <div className="relative">
                                                         <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                                                         <Input 
                                                            type="number"
                                                            className="h-8 text-sm pl-7 bg-background border-primary/20 focus-visible:border-primary"
                                                            value={update.price || ""}
                                                            onChange={(e) => updateTierItem(visaId, "price", parseFloat(e.target.value))}
                                                         />
                                                     </div>
                                                 </TableCell>
                                                 <TableCell>
                                                     <Input 
                                                        className="h-8 text-xs bg-background"
                                                        placeholder="Note..."
                                                        value={update.note}
                                                        onChange={(e) => updateTierItem(visaId, "note", e.target.value)}
                                                     />
                                                 </TableCell>
                                             </TableRow>
                                         )
                                     })}
                                 </TableBody>
                             </Table>
                        </div>
                   </div>
              </div>
              <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                  <Button variant="outline" onClick={() => setAgentTierOpen(false)}>Cancel</Button>
                  <Button onClick={handleBulkAgentTierUpdate} disabled={!tierAgentId}>
                      Save Changes
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Bulk Promo Dialog */}
      <Dialog open={promoBulkOpen} onOpenChange={setPromoBulkOpen}>
          <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                  <DialogTitle>Create Bulk Promo / War Visa</DialogTitle>
                  <DialogDescription>
                      Create a tiered pricing campaign for {selectedVisas.size} selected visas.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                      <Label>Campaign Name</Label>
                      <Input 
                          placeholder="e.g. War Visa 12.12" 
                          value={promoName}
                          onChange={(e) => setPromoName(e.target.value)}
                      />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Start Date (Optional)</Label>
                          <Input 
                              type="date"
                              value={promoDateRange.start || ""}
                              onChange={(e) => setPromoDateRange(prev => ({ ...prev, start: e.target.value }))}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>End Date (Optional)</Label>
                          <Input 
                              type="date"
                              value={promoDateRange.end || ""}
                              onChange={(e) => setPromoDateRange(prev => ({ ...prev, end: e.target.value }))}
                          />
                      </div>
                  </div>

                  <div className="space-y-3">
                      <div className="flex items-center justify-between">
                          <Label>Pricing Rules (Tiered)</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 text-xs" 
                            onClick={addPromoRule}
                          >
                              + Add Rule
                          </Button>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                           <Table>
                               <TableHeader>
                                   <TableRow className="bg-muted/30">
                                       <TableHead className="w-[80px]">Min Qty</TableHead>
                                       <TableHead className="w-[80px]">Max Qty</TableHead>
                                       <TableHead>Price (IDR)</TableHead>
                                       <TableHead className="w-[40px]"></TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {promoRules.map((rule, idx) => (
                                       <TableRow key={idx}>
                                           <TableCell className="p-2">
                                               <Input 
                                                    type="number" 
                                                    className="h-8 px-2 text-center"
                                                    value={rule.min}
                                                    onChange={(e) => updatePromoRule(idx, 'min', parseInt(e.target.value))}
                                               />
                                           </TableCell>
                                           <TableCell className="p-2">
                                               <Input 
                                                    type="number" 
                                                    className="h-8 px-2 text-center"
                                                    value={rule.max}
                                                    onChange={(e) => updatePromoRule(idx, 'max', parseInt(e.target.value))}
                                               />
                                           </TableCell>
                                           <TableCell className="p-2">
                                               <Input 
                                                    type="number" 
                                                    className="h-8 px-2 font-mono"
                                                    placeholder="Price"
                                                    value={rule.price || ""}
                                                    onChange={(e) => updatePromoRule(idx, 'price', parseFloat(e.target.value))}
                                               />
                                           </TableCell>
                                           <TableCell className="p-2">
                                               {promoRules.length > 1 && (
                                                   <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => removePromoRule(idx)}
                                                    >
                                                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
                                                   </Button>
                                               )}
                                           </TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                          Define price tiers based on quantity. E.g. Buy 1-5 for 500k, 6-10 for 450k.
                      </p>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setPromoBulkOpen(false)}>Cancel</Button>
                  <Button onClick={handleBulkCampaignCreate} className="bg-orange-600 hover:bg-orange-700">Create Campaign</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      {/* Print PDF Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Print Price List</DialogTitle>
                    <DialogDescription>Select which prices to include in the PDF.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="showRetail" 
                                checked={printConfig.showRetail}
                                onCheckedChange={(c) => setPrintConfig(prev => ({ ...prev, showRetail: !!c }))}
                            />
                            <Label htmlFor="showRetail">Include Retail Prices (FIT)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="showAgentStandard" 
                                checked={printConfig.showAgentStandard}
                                onCheckedChange={(c) => setPrintConfig(prev => ({ ...prev, showAgentStandard: !!c }))}
                            />
                            <Label htmlFor="showAgentStandard">Include Standard Agent Prices</Label>
                        </div>
                         {/* TODO: Add Promo Logic if needed, currently just a checkbox placeholder or we can implement basic promo column */}
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="showPromo" 
                                checked={printConfig.showPromo}
                                onCheckedChange={(c) => setPrintConfig(prev => ({ ...prev, showPromo: !!c }))}
                            />
                            <Label htmlFor="showPromo">Include Promo/Campaign Info</Label>
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-2">
                        <Label>Specific Agent Price (Optional)</Label>
                        <div className="relative">
                             <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                             <Input 
                                placeholder="Search agent to override prices..." 
                                className="pl-9"
                                value={printAgentQuery}
                                onChange={(e) => {
                                    setPrintAgentQuery(e.target.value);
                                    if(printConfig.agentId) setPrintConfig(prev => ({ ...prev, agentId: "", agentName: "" }));
                                }}
                             />
                             {printAgentResults.length > 0 && !printConfig.agentId && (
                                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                                    {printAgentResults.map(agent => (
                                        <div 
                                            key={agent.id}
                                            className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex flex-col"
                                            onClick={() => {
                                                setPrintConfig(prev => ({ ...prev, agentId: agent.id, agentName: agent.name }));
                                                setPrintAgentQuery(agent.name);
                                                setPrintAgentResults([]);
                                            }}
                                        >
                                            <span className="font-medium">{agent.name}</span>
                                            {agent.company_name && <span className="text-xs text-muted-foreground">{agent.company_name}</span>}
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            If selected, a column for this agent's special prices will be added.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handlePrint}>
                        <Printer className="size-4 mr-2" />
                        Print / Save as PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
      </Dialog>
      
      {/* Hidden Print Area */}
      <div id="print-area" className="hidden">
          <div className="header">
              <h1>Visa Price List</h1>
              <p suppressHydrationWarning>Generated on {new Date().toLocaleDateString()}</p>
              {printConfig.agentName && <p><strong>Special Pricing for:</strong> {printConfig.agentName}</p>}
          </div>
          <table>
              <thead>
                  <tr>
                      <th>Visa Name</th>
                      <th>Country</th>
                      <th>Type</th>
                      {printConfig.showRetail && <th>Retail (FIT)</th>}
                      {printConfig.showAgentStandard && <th>Agent Standard</th>}
                      {printConfig.agentId && <th>Special Price ({printConfig.agentName})</th>}
                      {printConfig.showPromo && <th>Active Promo</th>}
                  </tr>
              </thead>
              <tbody>
                  {(() => {
                      // Determine which visas to print: Selected only, or all Filtered
                      const visasToPrint = selectedVisas.size > 0 
                          ? filteredVisas.filter(v => selectedVisas.has(v.id))
                          : filteredVisas;
                          
                      return visasToPrint.length > 0 ? visasToPrint.map(visa => {
                          const specialPrice = printConfig.agentId ? printAgentData[visa.id] : null;

                          return (
                            <tr key={visa.id}>
                                <td>{visa.name}</td>
                                <td>{visa.country}</td>
                                <td>{visa.type}</td>
                                {printConfig.showRetail && (
                                    <td>
                                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(visa.price)}
                                    </td>
                                )}
                                {printConfig.showAgentStandard && (
                                    <td>
                                        {visa.priceAgent ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(visa.priceAgent) : "-"}
                                    </td>
                                )}
                                {printConfig.agentId && (
                                    <td>
                                        {specialPrice ? (
                                            <div>
                                                <span className="agent-price">
                                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(specialPrice.price)}
                                                </span>
                                                {specialPrice.note && <span className="note">{specialPrice.note}</span>}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
                                    </td>
                                )}
                                 {printConfig.showPromo && (
                                    <td>
                                        {visa.active_campaign_count > 0 ? (
                                            <span className="badge">Active</span>
                                        ) : "-"}
                                    </td>
                                )}
                            </tr>
                          );
                      }) : (
                          <tr>
                              <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>No visas selected</td>
                          </tr>
                      );
                  })()}
              </tbody>
          </table>
      </div>

    </div>
  );
}
