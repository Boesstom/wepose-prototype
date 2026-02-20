
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
  getAgentSpecialPrices,
  upsertAgentSpecialPrice,
  deleteAgentSpecialPrice,
  searchAgents,
  getVisaCampaigns,
  upsertVisaCampaign,
  deleteVisaCampaign,
  type AgentSpecialPrice,
  type VisaCampaign,
} from "@/lib/supabase/pricing";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    Delete01Icon, 
    PlusSignIcon, 
    Search01Icon, 
    SaleTag02Icon, 
    UserGroupIcon 
} from "@hugeicons/core-free-icons";
import { useDebounce } from "../../hooks/use-debounce";
import { toast } from "sonner";

interface SpecialPricingSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  visa: { id: string; name: string } | null;
  onUpdate: () => void;
}

export function SpecialPricingSidebar({
  isOpen,
  onOpenChange,
  visa,
  onUpdate,
}: SpecialPricingSidebarProps) {
  const [activeTab, setActiveTab] = useState("agents");

  // Agent Pricing State
  const [prices, setPrices] = useState<AgentSpecialPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [priceInput, setPriceInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [agentQuery, setAgentQuery] = useState("");
  const [agentResults, setAgentResults] = useState<{ id: string; name: string; company_name?: string }[]>([]);
  const debouncedAgentQuery = useDebounce(agentQuery, 300);

  // Promo Campaign State
  const [campaigns, setCampaigns] = useState<VisaCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [stepUpRules, setStepUpRules] = useState<{min: number; max: number; price: number}[]>([{min: 1, max: 10, price: 0}]);

  useEffect(() => {
    if (isOpen && visa) {
      loadPrices();
      loadCampaigns();
    } else {
        setPrices([]);
        setCampaigns([]);
    }
  }, [isOpen, visa]);

  // --- Agent Logic ---

  useEffect(() => {
    if (debouncedAgentQuery) {
      searchAgents(debouncedAgentQuery).then((res) => setAgentResults(res || []));
    } else {
        setAgentResults([]);
    }
  }, [debouncedAgentQuery]);

  const loadPrices = async () => {
    if (!visa) return;
    setLoadingPrices(true);
    try {
      const data = await getAgentSpecialPrices(visa.id);
      setPrices(data || []);
    } catch (error) {
      toast.error("Failed to load special prices");
    } finally {
        setLoadingPrices(false);
    }
  };

  const handleAddPrice = async () => {
      if (!visa) return;
      
      // Validation
      if (!selectedAgentId) {
          toast.error("Please select an agent from the search dropdown.");
          return;
      }
      
      const priceVal = parseFloat(priceInput);
      if (!priceInput || isNaN(priceVal) || priceVal < 0) {
          toast.error("Please enter a valid price amount.");
          return;
      }

      setLoadingPrices(true);
      try {
          await upsertAgentSpecialPrice({
              visa_id: visa.id,
              agent_id: selectedAgentId,
              price: priceVal,
              notes: notesInput
          });
          
          toast.success("Special price saved successfully");

          // Reset Form
          setPriceInput("");
          setNotesInput("");
          setSelectedAgentId("");
          setAgentQuery("");
          
          // Refresh Data
          await loadPrices();
          onUpdate();
      } catch(e) {
          // Error is logged in backend function
          toast.error("Failed to save special price. Check console for details.");
      } finally {
          setLoadingPrices(false);
      }
  }

  const handleDeletePrice = async (id: string) => {
      try {
          await deleteAgentSpecialPrice(id);
          toast.success("Special price deleted");
          loadPrices();
          onUpdate();
      } catch(e) {
          toast.error("Failed to delete special price");
      }
  }

  // --- Campaign Logic ---

  const loadCampaigns = async () => {
      if (!visa) return;
      setLoadingCampaigns(true);
      try {
          const data = await getVisaCampaigns(visa.id);
          setCampaigns(data || []);
      } catch(e) {
          toast.error("Failed to load campaigns");
      } finally {
          setLoadingCampaigns(false);
      }
  }

  const handleAddCampaign = async () => {
      if(!newCampaignName) return;
      try {
          await upsertVisaCampaign({
              visa_id: visa!.id,
              name: newCampaignName,
              is_active: true,
              rules: stepUpRules
          });
          toast.success("Campaign created");
          setNewCampaignName("");
          setStepUpRules([{min: 1, max: 10, price: 0}]);
          loadCampaigns();
          onUpdate(); // to update indicator in main table
      } catch(e) {
          toast.error("Failed to create campaign");
      }
  }

  const handleDeleteCampaign = async (id: string) => {
      try {
          await deleteVisaCampaign(id);
          toast.success("Campaign deleted");
          loadCampaigns();
          onUpdate();
      } catch(e) {
          toast.error("Failed to delete campaign");
      }
  }

  const updateRule = (index: number, field: keyof typeof stepUpRules[0], value: number) => {
      const newRules = [...stepUpRules];
      newRules[index] = { ...newRules[index], [field]: value };
      setStepUpRules(newRules);
  }

  const addRuleRow = () => {
      const lastMax = stepUpRules[stepUpRules.length - 1]?.max || 0;
      setStepUpRules([...stepUpRules, { min: lastMax + 1, max: lastMax + 10, price: 0 }]);
  }

  const removeRuleRow = (index: number) => {
      setStepUpRules(stepUpRules.filter((_, i) => i !== index));
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full flex flex-col h-full bg-background p-0 gap-0" showCloseButton={true}>
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Pricing Manager: {visa?.name}</SheetTitle>
          <SheetDescription>
            Manage agent-specific prices and promotional campaigns.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="agents" className="gap-2">
                        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />
                        Agent Pricing
                    </TabsTrigger>
                    <TabsTrigger value="promos" className="gap-2">
                        <HugeiconsIcon icon={SaleTag02Icon} strokeWidth={2} className="size-4" />
                        Promos & War Visa
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="agents" className="flex-1 overflow-y-auto p-6 space-y-8">
                 {/* Add New Agent Price */}
                 <div className="space-y-4 rounded-xl border p-5 bg-muted/20">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                        Add New Special Price
                    </h4>
                    <div className="space-y-4">
                        <div className="space-y-2 relative">
                            <Label className="text-xs font-medium text-muted-foreground">Select Agent</Label>
                            <div className="relative">
                                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search agent name..." 
                                    className="pl-9 bg-background"
                                    value={agentQuery}
                                    onChange={(e) => {
                                        setAgentQuery(e.target.value);
                                        if(selectedAgentId) setSelectedAgentId(""); 
                                    }}
                                />
                            </div>
                            {agentResults.length > 0 && !selectedAgentId && (
                                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-56 overflow-auto">
                                    {agentResults.map(agent => (
                                        <div 
                                            key={agent.id}
                                            className="px-4 py-2.5 text-sm hover:bg-accent cursor-pointer flex flex-col border-b last:border-0"
                                            onClick={() => {
                                                setAgentQuery(agent.name);
                                                setSelectedAgentId(agent.id);
                                                setAgentResults([]);
                                            }}
                                        >
                                            <span className="font-medium">{agent.name}</span>
                                            {agent.company_name && <span className="text-xs text-muted-foreground">{agent.company_name}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Special Price (Fixed)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">Rp</span>
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        className="pl-9 bg-background"
                                        value={priceInput}
                                        onChange={(e) => setPriceInput(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Note (Optional)</Label>
                                <Input 
                                    placeholder="e.g. Contract 2024" 
                                    value={notesInput}
                                    className="bg-background"
                                    onChange={(e) => setNotesInput(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <Button 
                            type="button"
                            className="w-full gap-2" 
                            onClick={handleAddPrice}
                        >
                            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
                            Add Special Price
                        </Button>
                    </div>
                 </div>

                 {/* List Agent Prices */}
                 <div className="space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                        Active Agent Rules
                    </h4>
                    {loadingPrices ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : prices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed bg-muted/10">No special prices set for this visa.</div>
                    ) : (
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Agent</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prices.map((p) => (
                                        <TableRow key={p.id} className="hover:bg-muted/20">
                                            <TableCell>
                                                <div className="font-medium text-sm">{p.agent?.name || "Unknown"}</div>
                                                {p.agent?.company_name && <div className="text-xs text-muted-foreground">{p.agent.company_name}</div>}
                                                {p.notes && <div className="text-[10px] text-muted-foreground mt-0.5 italic flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                                                    {p.notes}
                                                </div>}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm font-medium">
                                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.price)}
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeletePrice(p.id)}
                                                >
                                                    <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                 </div>
            </TabsContent>

            <TabsContent value="promos" className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Add New Campaign */}
                <div className="space-y-4 rounded-xl border p-5 bg-muted/20">
                     <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                            Create Promo / War Visa
                        </h4>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Step-Up Pricing</span>
                     </div>
                     
                     <div className="space-y-4">
                         <div className="space-y-2">
                             <Label className="text-xs font-medium text-muted-foreground">Campaign Name</Label>
                             <Input 
                                 placeholder="e.g. Flash Sale 12.12"
                                 value={newCampaignName}
                                 className="bg-background"
                                 onChange={(e) => setNewCampaignName(e.target.value)} 
                             />
                         </div>

                         <div className="space-y-3">
                             <Label className="text-xs font-medium text-muted-foreground flex justify-between">
                                <span>Pricing Tiers (Rules)</span>
                                <span className="text-muted-foreground/60 font-normal">Define price based on quantity slots</span>
                             </Label>
                             
                             <div className="space-y-2">
                                {/* Header Row */}
                                <div className="grid grid-cols-[1fr_1fr_1.5fr_30px] gap-2 px-1">
                                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Min Slot</span>
                                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Max Slot</span>
                                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Fixed Price</span>
                                </div>

                                {stepUpRules.map((rule, idx) => (
                                    <div key={idx} className="flex gap-2 items-center group">
                                         <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-2 flex-1">
                                             <Input 
                                                type="number" 
                                                className="h-9 text-xs bg-background"
                                                value={rule.min}
                                                onChange={(e) => updateRule(idx, 'min', parseInt(e.target.value))}
                                             />
                                             <Input 
                                                type="number" 
                                                className="h-9 text-xs bg-background"
                                                value={rule.max}
                                                onChange={(e) => updateRule(idx, 'max', parseInt(e.target.value))}
                                             />
                                             <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                                                <Input 
                                                    type="number" 
                                                    className="h-9 text-xs pl-7 bg-background"
                                                    value={rule.price}
                                                    onChange={(e) => updateRule(idx, 'price', parseInt(e.target.value))}
                                                />
                                             </div>
                                         </div>
                                         <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity" onClick={() => removeRuleRow(idx)}>
                                             <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                                         </Button>
                                     </div>
                                 ))}
                             </div>
                             
                             <Button variant="outline" size="sm" className="w-full text-xs h-8 border-dashed text-muted-foreground bg-transparent hover:bg-background" onClick={addRuleRow}>
                                 <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3 mr-1.5" />
                                 Add Another Price Tier
                             </Button>
                         </div>

                         <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={handleAddCampaign} disabled={!newCampaignName}>
                             Save Campaign
                         </Button>
                     </div>
                </div>

                {/* List Campaigns */}
                 <div className="space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                        Active Campaigns
                    </h4>
                    {loadingCampaigns ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : campaigns.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed bg-muted/10">No active campaigns.</div>
                    ) : (
                        <div className="grid gap-3">
                            {campaigns.map(c => (
                                <div key={c.id} className="border rounded-xl p-4 relative bg-card shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-orange-100 rounded-md">
                                                <HugeiconsIcon icon={SaleTag02Icon} strokeWidth={2} className="size-4 text-orange-600" />
                                            </div>
                                            <div className="font-medium text-sm">{c.name}</div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive -mr-2 -mt-2"
                                            onClick={() => handleDeleteCampaign(c.id)}
                                        >
                                            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                                        </Button>
                                    </div>
                                    <div className="bg-muted/30 rounded-lg text-xs p-3 space-y-1.5 border border-muted/50">
                                        {Array.isArray(c.rules) && c.rules.map((r: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center bg-background px-2 py-1.5 rounded border border-muted/50 shadow-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                                    <span className="text-muted-foreground font-medium">Slot {r.min} - {r.max}</span>
                                                </div>
                                                <span className="font-mono font-semibold text-foreground">
                                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.price)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
