"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { HugeiconsIcon } from "@hugeicons/react";
import { 
    CheckmarkCircle01Icon, 
    PassportIcon, 
    DocumentValidationIcon, 
    Settings01Icon,
    Globe02Icon,
    Loading03Icon,
    PlusSignIcon,
    Delete02Icon,
    QuestionIcon,
    Clock01Icon,
    Calendar03Icon
} from "@hugeicons/core-free-icons";

// Supabase Imports
import { getCountries, getCities, type Address } from "@/lib/supabase/addresses";
import { getDocuments, type Document } from "@/lib/supabase/documents";
import { createVisa, updateVisa, getVisaById } from "@/lib/supabase/visas";
import { getPurposes, addPurpose, type Purpose } from "@/lib/supabase/purposes";
import type { Question, VisaDocumentConfig } from "@/types/visa";
// ─── TYPES & CONSTANTS ───────────────────────────────────────────────

type FormDocument = Document & {
    isSelected: boolean;
    isMandatory: boolean;
    notes: string;
    config: VisaDocumentConfig;
};

export interface JobStatus {
  id: string;
  name: string;
}

// In case the DB fetch fails, we keep a fallback here
const FALLBACK_JOB_STATUS_OPTIONS = [
  "Employee", "Business Owner", "Freelance", "Student", "Housewife", "Retiree", "Unemployed"
];

const PROCESSING_TYPES = [
    { value: 'fix', label: 'Fixed Days' },
    { value: 'range', label: 'Range Days' },
];

interface FormData {
  // 1. Identity
  name: string;
  country: string;
  purpose: string; // e.g. Tourist, Business
  category?: 'First Time' | 'Extension';
  type: string; // Single, Double, Multiple

  // 2. Processing & Validity
  stayDurationType: 'fix' | 'range';
  stayDurationFix: string;
  stayDurationMin: string;
  stayDurationMax: string;
  
  validityType: 'fix' | 'range';
  validityFix: string; 
  validityMin: string;
  validityMax: string;

  processingTimeType: 'fix' | 'range';
  processingTimeFix: string; // Internal (Wepose)
  processingTimeMin: string;
  processingTimeMax: string;
  
  processCenterType: 'fix' | 'range';
  processCenterFix: string;
  processCenterMin: string;
  processCenterMax: string;

  earliestApplyTime: string;

  // 4. Requirements (JSON Data mapped to form fields)
  minAge: string;
  maxAge: string;
  reqJobStatus: string[];
  reqMinBalance: string; // Financial
  reqTravelHistory: string; 
  reqMarriage: string;
  reqRelationship: string;
  
  allowedSponsors: string[];
  sponsorOtherDetails: string;

  // 5. Operations
  isNeedAppointment: boolean;
  isApplicantPresenceRequired: boolean;
  applicationMethod: string; // Online/Offline
  needPhysicalPassport: boolean;
  
  locationType: 'appointed' | 'available';
  appointedCity: string;
  appointedCitiesList: string[];
  availableCitiesList: string[];

  // 6. Questions (JSON list)
  questions: Question[]; 
}

interface VisaFormProps {
    visaId?: string;
}

export function VisaForm({ visaId }: VisaFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") as 'First Time' | 'Extension' | null;

  // Loading States
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Data
  const [masterCountries, setMasterCountries] = useState<Address[]>([]);
  const [masterCities, setMasterCities] = useState<Address[]>([]);
  const [masterPurposes, setMasterPurposes] = useState<Purpose[]>([]);
  const [masterJobStatuses, setMasterJobStatuses] = useState<JobStatus[]>([]);
  const [documents, setDocuments] = useState<FormDocument[]>([]);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    name: "",
    country: "",
    purpose: "Tourist",
    category: categoryParam || undefined,
    type: "Single",
    
    stayDurationType: "fix",
    stayDurationFix: "",
    stayDurationMin: "",
    stayDurationMax: "",
    
    validityType: "fix",
    validityFix: "",
    validityMin: "",
    validityMax: "",
    
    processingTimeType: "fix",
    processingTimeFix: "",
    processingTimeMin: "",
    processingTimeMax: "",
    
    processCenterType: "fix",
    processCenterFix: "",
    processCenterMin: "",
    processCenterMax: "",
    
    earliestApplyTime: "",

    minAge: "",
    maxAge: "",
    reqJobStatus: [],
    reqMinBalance: "",
    reqTravelHistory: "",
    reqMarriage: "",
    reqRelationship: "",
    allowedSponsors: [],
    sponsorOtherDetails: "",

    isNeedAppointment: false,
    isApplicantPresenceRequired: false,
    applicationMethod: "Online",
    needPhysicalPassport: false,
    locationType: "appointed",
    appointedCity: "",
    appointedCitiesList: [],
    availableCitiesList: [],

    questions: []
  });

  // Current configuring document (Dialog)
  const [configuringDocId, setConfiguringDocId] = useState<string | null>(null);

  // ─── HOOKS ─────────────────────────────────────────────────────────────

  useEffect(() => {
      async function loadData() {
          try {
              const [countriesData, citiesData, docsData, purposesData, { getJobStatuses }] = await Promise.all([
                  getCountries(),
                  getCities(),
                  getDocuments(),
                  getPurposes(),
                  import('@/lib/supabase/jobStatuses')
              ]);
              const jobStatData = await getJobStatuses();
              setMasterCountries(countriesData);
              setMasterCities(citiesData);
              setMasterPurposes(purposesData);
              setMasterJobStatuses(jobStatData);
              
              let initialDocs = docsData.map(d => ({
                  ...d,
                  isSelected: false,
                  isMandatory: false,
                  notes: "",
                  config: {}
              }));

              if (visaId) {
                  const visa = await getVisaById(visaId);
                  if (visa) {
                      // Map to FormData
                      const breakdown = (visa.pricing_breakdown as any) || {};
                      const reqs = (visa.requirements_data as any) || {};
                      
                      setFormData(prev => ({
                          ...prev,
                          name: visa.name,
                          country: visa.country,
                          purpose: visa.purpose || "Tourist",
                          category: (visa.category as any) || undefined,
                          type: visa.type,
                          
                          stayDurationType: (visa.stay_duration_type as any) || 'fix',
                          stayDurationFix: visa.stay_duration_fix?.toString() || visa.stay_duration?.toString() || "", // fallback to old stay_duration
                          stayDurationMin: visa.stay_duration_min?.toString() || "",
                          stayDurationMax: visa.stay_duration_max?.toString() || "",
                          
                          validityType: (visa.validity_type as any) || 'fix',
                          validityFix: visa.validity_fix?.toString() || "",
                          validityMin: visa.validity_min?.toString() || "",
                          validityMax: visa.validity_max?.toString() || "",
                          
                          processingTimeType: (visa.processing_time_type as any) || 'fix',
                          processingTimeFix: visa.processing_time_fix?.toString() || "",
                          processingTimeMin: visa.processing_time_min?.toString() || "",
                          processingTimeMax: visa.processing_time_max?.toString() || "",
                          
                          processCenterType: (visa.process_center_type as any) || 'fix',
                          processCenterFix: visa.process_center_fix?.toString() || "",
                          processCenterMin: visa.process_center_min?.toString() || "",
                          processCenterMax: visa.process_center_max?.toString() || "",
                          
                          earliestApplyTime: visa.earliest_apply_time?.toString() || "",

                          minAge: visa.min_age?.toString() || "",
                          maxAge: visa.max_age?.toString() || "",
                          reqJobStatus: reqs.job_status || [],
                          reqMinBalance: reqs.min_balance?.toString() || "",
                          reqTravelHistory: visa.history_requirement || "",
                          reqMarriage: visa.marriage_requirement || "",
                          reqRelationship: visa.relationship_requirement || "",
                          allowedSponsors: visa.allowed_sponsors || [],
                          sponsorOtherDetails: visa.sponsor_other_details || "",

                          isNeedAppointment: visa.is_need_appointment,
                          isApplicantPresenceRequired: visa.is_applicant_presence_required,
                          applicationMethod: visa.application_method,
                          needPhysicalPassport: visa.need_physical_passport,
                          locationType: (visa.location_type as any) || 'appointed',
                          appointedCity: visa.appointed_city || "",
                          appointedCitiesList: visa.appointed_cities_list || [],
                          availableCitiesList: visa.available_cities_list || [],

                          questions: (visa.questions_data as unknown as Question[]) || []
                      }));

                      // Map Documents
                      const visaDocMap = new Map();
                      if(visa.visa_documents) {
                          visa.visa_documents.forEach(vd => visaDocMap.set(vd.document_id, vd));
                      }
                      
                      initialDocs = initialDocs.map(d => {
                          const vd = visaDocMap.get(d.id);
                          if(vd) {
                              return { 
                                  ...d, 
                                  isSelected: true, 
                                  isMandatory: vd.is_mandatory, 
                                  notes: vd.notes || "",
                                  config: (vd.config as VisaDocumentConfig) || {}
                              };
                          }
                          return d;
                      });
                  }
              }

              setDocuments(initialDocs);
          } catch (error) {
              console.error("Failed to load data", error);
          } finally {
              setIsLoadingMaster(false);
          }
      }
      loadData();
  }, [visaId]);

  // ─── HELPERS ───────────────────────────────────────────────────────────

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = (parent: keyof FormData, key: string, value: any) => {
      // For simple nested updates if needed
  };

  const handleCreatePurpose = async (newPurpose: string) => {
      const added = await addPurpose(newPurpose);
      if (added) {
          setMasterPurposes(prev => [...prev, added].sort((a,b) => a.name.localeCompare(b.name)));
          updateFormData('purpose', added.name);
      }
  };

  const handleCreateJobStatus = async (newJobStatus: string) => {
      const { addJobStatus } = await import('@/lib/supabase/jobStatuses');
      const added = await addJobStatus(newJobStatus);
      if (added) {
          setMasterJobStatuses(prev => [...prev, added].sort((a,b) => a.name.localeCompare(b.name)));
          updateFormData('reqJobStatus', [...formData.reqJobStatus, added.name]);
      }
  };

  const purposeOptions = useMemo(() => 
    masterPurposes.map(p => ({
        value: p.name,
        label: p.name
    })), [masterPurposes]);
    
  const jobStatusOptions = useMemo(() => 
    masterJobStatuses.map(j => j.name), [masterJobStatuses]);

  const countryOptions = useMemo(() => 
    masterCountries.map(c => ({
      value: c.name,
      label: c.name,
      icon: c.flag ? <span>{c.flag}</span> : undefined,
    })), [masterCountries]);

  const cityOptions = useMemo(() => 
    masterCities.map(city => {
      const country = masterCountries.find(c => c.id === city.parent_id);
      return {
        value: city.name,
        label: `${city.name}${country ? ` (${country.name})` : ''}`,
      };
    }), [masterCities, masterCountries]);

  // Document Toggles
  const toggleDocument = (id: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, isSelected: !d.isSelected } : d));
  };

  const updateDocumentConfig = (id: string, field: keyof VisaDocumentConfig, value: any) => {
      setDocuments(prev => prev.map(d => 
          d.id === id ? { ...d, config: { ...d.config, [field]: value } } : d
      ));
  };

  // Questions
  const addQuestion = () => {
      setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, { id: crypto.randomUUID(), text: "", type: "text", required: true }]
      }));
  };

    const removeQuestion = (id: string) => {
        setFormData(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== id) }));
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
        }));
    };


  // ─── SUBMISSION ────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!formData.name || !formData.country) {
        alert("Please fill in required fields (Name, Country)");
        return;
    }

    setIsSubmitting(true);
    try {
        const visaInput: any = {
            name: formData.name,
            country: formData.country,
            purpose: formData.purpose,
            category: formData.category || null,
            type: formData.type,
            
            // Times
            stay_duration: parseInt(formData.stayDurationFix) || null, // legacy support or master value
            stay_duration_type: formData.stayDurationType,
            stay_duration_fix: parseInt(formData.stayDurationFix) || null,
            stay_duration_min: parseInt(formData.stayDurationMin) || null,
            stay_duration_max: parseInt(formData.stayDurationMax) || null,

            earliest_apply_time: parseInt(formData.earliestApplyTime) || null,
            
            processing_time_type: formData.processingTimeType,
            processing_time_fix: parseInt(formData.processingTimeFix) || null,
            processing_time_min: parseInt(formData.processingTimeMin) || null,
            processing_time_max: parseInt(formData.processingTimeMax) || null,

            process_center_type: formData.processCenterType,
            process_center_fix: parseInt(formData.processCenterFix) || null,
            process_center_min: parseInt(formData.processCenterMin) || null,
            process_center_max: parseInt(formData.processCenterMax) || null,
            
            validity_type: formData.validityType,
            validity_fix: parseInt(formData.validityFix) || null,
            validity_min: parseInt(formData.validityMin) || null,
            validity_max: parseInt(formData.validityMax) || null,
            
            // Requirements
            min_age: parseInt(formData.minAge) || null,
            max_age: parseInt(formData.maxAge) || null,
            job_requirement: null, // deprecated or use if single field needed
            marriage_requirement: formData.reqMarriage || null,
            relationship_requirement: formData.reqRelationship || null,
            history_requirement: formData.reqTravelHistory || null, 
            allowed_sponsors: formData.allowedSponsors,
            sponsor_other_details: formData.sponsorOtherDetails || null,
            
            requirements_data: {
                job_status: formData.reqJobStatus,
                min_balance: parseFloat(formData.reqMinBalance) || 0,
            },

            // Operations
            is_need_appointment: formData.isNeedAppointment,
            is_applicant_presence_required: formData.isApplicantPresenceRequired,
            application_method: formData.applicationMethod,
            need_physical_passport: formData.needPhysicalPassport,
            location_type: formData.locationType,
            appointed_city: formData.appointedCity || null,
            appointed_cities_list: formData.appointedCitiesList,
            available_cities_list: formData.availableCitiesList,
            
            questions_data: formData.questions as any,
        };

        const selectedDocs = documents
            .filter(d => d.isSelected)
            .map(d => ({
                document_id: d.id,
                is_mandatory: d.isMandatory,
                notes: d.notes,
                config: d.config
            }));

        if (visaId) {
            await updateVisa(visaId, visaInput, selectedDocs);
            alert("Visa updated!");
        } else {
            await createVisa(visaInput, selectedDocs);
            alert("Visa created!");
        }
        
        router.push('/dashboard/visa');
        
    } catch (error) {
        console.error("Submission failed", error);
        alert("Failed to save visa.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoadingMaster) {
      return <div className="flex justify-center items-center min-h-[400px]">
          <HugeiconsIcon icon={Loading03Icon} className="animate-spin size-8 text-primary" />
      </div>;
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
              <h2 className="text-2xl font-bold tracking-tight">
                  {visaId ? "Edit Visa" : "Create New Visa"}
              </h2>
              <p className="text-muted-foreground">Configure detailed visa requirements and pricing.</p>
          </div>
          <div className="flex gap-2">
               <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
               <Button onClick={handleSubmit} disabled={isSubmitting}>
                   {isSubmitting && <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2 size-4" />}
                   Save Visa
               </Button>
          </div>
      </div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50 rounded-lg">
          <TabsTrigger value="identity" className="py-2.5">Identity</TabsTrigger>
          <TabsTrigger value="process" className="py-2.5">Process</TabsTrigger>
          <TabsTrigger value="requirements" className="py-2.5">Requirements</TabsTrigger>
          <TabsTrigger value="documents" className="py-2.5">Documents</TabsTrigger>
          <TabsTrigger value="questions" className="py-2.5">Questions</TabsTrigger>
        </TabsList>
        
        {/* 1. IDENTITY & BASIC INFO */}
        <TabsContent value="identity" className="space-y-4 py-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <Card className="overflow-visible">
                <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Country</Label>
                        <SearchableSelect 
                            options={countryOptions}
                            value={formData.country}
                            onValueChange={v => updateFormData('country', v)}
                            placeholder="Select Country"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Visa Name</Label>
                        <Input value={formData.name} onChange={e => updateFormData('name', e.target.value)} placeholder="e.g. Tourist Visa Single Entry" />
                    </div>
                    <div className="space-y-2">
                        <Label>Purpose</Label>
                        <SearchableSelect 
                            options={purposeOptions}
                            value={formData.purpose}
                            onValueChange={v => updateFormData('purpose', v)}
                            onCreate={handleCreatePurpose}
                            placeholder="Select Purpose"
                            searchPlaceholder="Search or type to add..."
                            emptyMessage="No purpose found."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={formData.category || "First Time"} onValueChange={v => updateFormData('category', v)}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="First Time">First Time</SelectItem>
                                 <SelectItem value="Extension">Extension</SelectItem>
                             </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Entry Type</Label>
                         <Select value={formData.type} onValueChange={v => updateFormData('type', v)}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="Single">Single Entry</SelectItem>
                                 <SelectItem value="Double">Double Entry</SelectItem>
                                 <SelectItem value="Multiple">Multiple Entry</SelectItem>
                             </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 2. PROCESS & VALIDITY */}
        <TabsContent value="process" className="space-y-4 py-4 animate-in fade-in slide-in-from-left-4 duration-300">
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><HugeiconsIcon icon={Calendar03Icon} className="size-5" />Validity & Duration</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label>Stay Duration (Days)</Label>
                        <div className="flex gap-2">
                             <Select value={formData.stayDurationType} onValueChange={v => updateFormData('stayDurationType', v)}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fix">Fixed</SelectItem>
                                    <SelectItem value="range">Range</SelectItem>
                                </SelectContent>
                            </Select>
                            {formData.stayDurationType === 'fix' ? (
                                <Input type="number" placeholder="Days" value={formData.stayDurationFix} onChange={e => updateFormData('stayDurationFix', e.target.value)} />
                            ) : (
                                <div className="flex gap-2 w-full">
                                    <Input type="number" placeholder="Min" value={formData.stayDurationMin} onChange={e => updateFormData('stayDurationMin', e.target.value)} />
                                    <Input type="number" placeholder="Max" value={formData.stayDurationMax} onChange={e => updateFormData('stayDurationMax', e.target.value)} />
                                </div>
                            )}
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label>Validity Period (Start to Expiry)</Label>
                        <div className="flex gap-2">
                            <Select value={formData.validityType} onValueChange={v => updateFormData('validityType', v)}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fix">Fixed</SelectItem>
                                    <SelectItem value="range">Range</SelectItem>
                                </SelectContent>
                            </Select>
                            {formData.validityType === 'fix' ? (
                                <Input type="number" placeholder="Days" value={formData.validityFix} onChange={e => updateFormData('validityFix', e.target.value)} />
                            ) : (
                                <div className="flex gap-2 w-full">
                                    <Input type="number" placeholder="Min" value={formData.validityMin} onChange={e => updateFormData('validityMin', e.target.value)} />
                                    <Input type="number" placeholder="Max" value={formData.validityMax} onChange={e => updateFormData('validityMax', e.target.value)} />
                                </div>
                            )}
                        </div>
                     </div>
                </CardContent>
             </Card>

             <Card>
                 <CardHeader><CardTitle className="flex items-center gap-2"><HugeiconsIcon icon={Clock01Icon} className="size-5" />Processing Times</CardTitle></CardHeader>
                 <CardContent className="space-y-6">
                    {/* Wepose Internal */}
                    <div className="space-y-2">
                        <Label>Internal Processing (Wepose)</Label>
                        <div className="flex gap-2 items-center">
                             <Select value={formData.processingTimeType} onValueChange={v => updateFormData('processingTimeType', v)}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="fix">Fixed</SelectItem><SelectItem value="range">Range</SelectItem></SelectContent>
                            </Select>
                            {formData.processingTimeType === 'fix' ? (
                                <Input type="number" className="max-w-[150px]" placeholder="Days" value={formData.processingTimeFix} onChange={e => updateFormData('processingTimeFix', e.target.value)} />
                            ) : (
                                <div className="flex gap-2 max-w-[300px]">
                                    <Input type="number" placeholder="Min" value={formData.processingTimeMin} onChange={e => updateFormData('processingTimeMin', e.target.value)} />
                                    <Input type="number" placeholder="Max" value={formData.processingTimeMax} onChange={e => updateFormData('processingTimeMax', e.target.value)} />
                                </div>
                            )}
                            <span className="text-sm text-muted-foreground">Days</span>
                        </div>
                    </div>

                    {/* Visa Center */}
                    <div className="space-y-2">
                        <Label>Visa Center / Embassy Processing</Label>
                        <div className="flex gap-2 items-center">
                             <Select value={formData.processCenterType} onValueChange={v => updateFormData('processCenterType', v)}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="fix">Fixed</SelectItem><SelectItem value="range">Range</SelectItem></SelectContent>
                            </Select>
                            {formData.processCenterType === 'fix' ? (
                                <Input type="number" className="max-w-[150px]" placeholder="Days" value={formData.processCenterFix} onChange={e => updateFormData('processCenterFix', e.target.value)} />
                            ) : (
                                <div className="flex gap-2 max-w-[300px]">
                                    <Input type="number" placeholder="Min" value={formData.processCenterMin} onChange={e => updateFormData('processCenterMin', e.target.value)} />
                                    <Input type="number" placeholder="Max" value={formData.processCenterMax} onChange={e => updateFormData('processCenterMax', e.target.value)} />
                                </div>
                            )}
                            <span className="text-sm text-muted-foreground">Days</span>
                        </div>
                    </div>
                 </CardContent>
             </Card>

             <Card className="overflow-visible">
                 <CardHeader><CardTitle>Application Operation</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                     <div className="flex items-center justify-between border p-3 rounded-md">
                         <div className="space-y-0.5">
                             <Label>Online Submission</Label>
                             <p className="text-xs text-muted-foreground">Is this visa applied fully online?</p>
                         </div>
                         <Switch 
                            checked={formData.applicationMethod === 'Online'} 
                            onCheckedChange={c => updateFormData('applicationMethod', c ? 'Online' : 'Offline')} 
                         />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="appt" checked={formData.isNeedAppointment} onCheckedChange={(c: boolean) => updateFormData('isNeedAppointment', c)} />
                            <Label htmlFor="appt">Appointment Required</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bio" checked={formData.isApplicantPresenceRequired} onCheckedChange={(c: boolean) => updateFormData('isApplicantPresenceRequired', c)} />
                            <Label htmlFor="bio">Applicant Presence Required (Biometrics/Interview)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="phys" checked={formData.needPhysicalPassport} onCheckedChange={(c: boolean) => updateFormData('needPhysicalPassport', c)} />
                            <Label htmlFor="phys">Physical Passport Required</Label>
                        </div>
                     </div>

                     {formData.applicationMethod === 'Offline' && (
                        <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                             <div className="space-y-2">
                                <Label>Location Type</Label>
                                <Select value={formData.locationType} onValueChange={(v: any) => updateFormData('locationType', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="appointed">Appointed (Specific City per Applicant)</SelectItem>
                                        <SelectItem value="available">Available (Applicant Chooses from List)</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>

                             {formData.locationType === 'appointed' ? (
                                <div className="space-y-2">
                                    <Label>Appointed Cities (One can be defaulted, usually Jakarta)</Label>
                                     <SearchableSelect 
                                         options={cityOptions}
                                         value={formData.appointedCity}
                                         onValueChange={v => updateFormData('appointedCity', v)}
                                         placeholder="Select Default Appointed City"
                                     />
                                     <div className="text-xs text-muted-foreground">
                                         Or manage list for specific jurisdictions if needed.
                                     </div>
                                </div>
                             ) : (
                                <div className="space-y-2">
                                    <Label>Available Cities (Where applicant can apply)</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.availableCitiesList.map(city => (
                                            <Badge key={city} variant="secondary" className="flex items-center gap-1">
                                                {city}
                                                <HugeiconsIcon icon={Delete02Icon} className="size-3 cursor-pointer" onClick={() => {
                                                    updateFormData('availableCitiesList', formData.availableCitiesList.filter(c => c !== city))
                                                }} />
                                            </Badge>
                                        ))}
                                    </div>
                                    <SearchableSelect 
                                         options={cityOptions}
                                         value=""
                                         onValueChange={v => {
                                             if(v && !formData.availableCitiesList.includes(v)) {
                                                 updateFormData('availableCitiesList', [...formData.availableCitiesList, v]);
                                             }
                                         }}
                                         placeholder="Add City..."
                                     />
                                </div>
                             )}
                        </div>
                     )}
                 </CardContent>
             </Card>
        </TabsContent>

        {/* 3. REQUIREMENTS */}
        <TabsContent value="requirements" className="space-y-4 py-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><HugeiconsIcon icon={DocumentValidationIcon} className="size-5" />Eligibility & Requirements</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Age Restriction</Label>
                        <div className="flex gap-2">
                            <Input type="number" placeholder="Min Age" value={formData.minAge} onChange={e => updateFormData('minAge', e.target.value)} />
                            <Input type="number" placeholder="Max Age" value={formData.maxAge} onChange={e => updateFormData('maxAge', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Minimum Bank Balance</Label>
                        <Input type="number" placeholder="e.g. 50000000" value={formData.reqMinBalance} onChange={e => updateFormData('reqMinBalance', e.target.value)} />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Detailed Requirements</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Textarea placeholder="Travel History Requirements (e.g. Must have visited OECD countries)" value={formData.reqTravelHistory} onChange={e => updateFormData('reqTravelHistory', e.target.value)} className="min-h-[100px]" />
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Allowed Job Status</Label>
                                <div className="grid grid-cols-2 gap-2 border p-2 rounded-md h-[150px] overflow-y-auto w-full">
                                    {(jobStatusOptions.length > 0 ? jobStatusOptions : FALLBACK_JOB_STATUS_OPTIONS).map(status => (
                                        <div key={status} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`job-${status}`} 
                                                checked={formData.reqJobStatus.includes(status)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setFormData(p => ({ ...p, reqJobStatus: [...p.reqJobStatus, status] }));
                                                    else setFormData(p => ({ ...p, reqJobStatus: p.reqJobStatus.filter(s => s !== status) }));
                                                }}
                                            />
                                            <Label htmlFor={`job-${status}`} className="font-normal text-[11px] leading-tight break-words">{status}</Label>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 w-full">
                                    <SearchableSelect 
                                        options={[{value: '', label: ''}]} // Dummy options since we only use it to add right now
                                        value=""
                                        onValueChange={() => {}} 
                                        onCreate={handleCreateJobStatus}
                                        placeholder="Add New Job Status..."
                                        searchPlaceholder="Type new job status..."
                                        emptyMessage="Type to create status"
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 5. DOCUMENTS */}
        <TabsContent value="documents" className="space-y-4 py-4 animate-in fade-in slide-in-from-left-4 duration-300">
             <Card>
                 <CardHeader><CardTitle>Required Documents</CardTitle><CardDescription>Select documents and configure specific rules.</CardDescription></CardHeader>
                 <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {documents.map(doc => (
                             <div key={doc.id} className={`border p-3 rounded-md flex items-start gap-3 transition-colors ${doc.isSelected ? 'border-primary bg-primary/5' : 'opacity-70'}`}>
                                 <Checkbox 
                                    id={`doc-${doc.id}`} 
                                    checked={doc.isSelected} 
                                    onCheckedChange={() => toggleDocument(doc.id)} 
                                    className="mt-1"
                                 />
                                 <div className="flex-1 space-y-1">
                                     <div className="flex items-center justify-between">
                                          <Label htmlFor={`doc-${doc.id}`} className="font-medium cursor-pointer">{doc.name}</Label>
                                          {doc.isSelected && (
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setConfiguringDocId(doc.id)}>
                                                  <HugeiconsIcon icon={Settings01Icon} className="size-4 text-muted-foreground" />
                                              </Button>
                                          )}
                                     </div>
                                     <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
                                     {doc.isSelected && (
                                         <div className="flex gap-2 mt-2">
                                             <div className="flex items-center space-x-1">
                                                <Checkbox id={`mand-${doc.id}`} checked={doc.isMandatory} onCheckedChange={(c: boolean) => {
                                                    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, isMandatory: c } : d));
                                                }} />
                                                <Label htmlFor={`mand-${doc.id}`} className="text-xs font-normal">Mandatory</Label>  
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </CardContent>
             </Card>

             {/* Document Config Dialog */}
             <Dialog open={!!configuringDocId} onOpenChange={(o) => !o && setConfiguringDocId(null)}>
                 <DialogContent>
                     <DialogHeader>
                         <DialogTitle>Configure Document Rules</DialogTitle>
                         <DialogDescription>Specific requirements for {documents.find(d => d.id === configuringDocId)?.name}</DialogDescription>
                     </DialogHeader>
                     {configuringDocId && (
                         <div className="space-y-4 py-2">
                             {/* Specific configs for this document */}
                             <div className="space-y-2">
                                 <Label>Specific Notes / Description for Applicant</Label>
                                 <Textarea 
                                    value={documents.find(d => d.id === configuringDocId)?.notes || ""} 
                                    onChange={e => setDocuments(prev => prev.map(d => d.id === configuringDocId ? { ...d, notes: e.target.value } : d))}
                                    placeholder="e.g. Must be color scan, minimum 300dpi..."
                                 />
                             </div>
                             
                             {/* Mock Config Fields */}
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                     <Label>Photo Size / Spec</Label>
                                     <Input 
                                        value={documents.find(d => d.id === configuringDocId)?.config?.photo_size || ""}
                                        onChange={e => updateDocumentConfig(configuringDocId, 'photo_size', e.target.value)}
                                        placeholder="e.g. 3.5x4.5cm white bg"
                                     />
                                 </div>
                                 <div className="flex items-center space-x-2 pt-8">
                                     <Checkbox 
                                        checked={documents.find(d => d.id === configuringDocId)?.config?.original_required || false}
                                        onCheckedChange={c => updateDocumentConfig(configuringDocId, 'original_required', c)}
                                     />
                                     <Label>Original Document Required</Label>
                                 </div>
                             </div>
                         </div>
                     )}
                     <DialogFooter>
                         <Button onClick={() => setConfiguringDocId(null)}>Done</Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>
        </TabsContent>

        {/* 6. QUESTIONS */}
        <TabsContent value="questions" className="space-y-4 py-4 animate-in fade-in slide-in-from-left-4 duration-300">
             <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                     <CardTitle className="flex items-center gap-2"><HugeiconsIcon icon={QuestionIcon} className="size-5" />Applicant Questions</CardTitle>
                     <Button size="sm" onClick={addQuestion}><HugeiconsIcon icon={PlusSignIcon} className="size-4 mr-1" /> Add Question</Button>
                 </CardHeader>
                 <CardContent className="space-y-4">
                     {formData.questions.length === 0 && <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">No extra questions defined.</div>}
                     {formData.questions.map((q, idx) => (
                         <div key={q.id} className="border p-4 rounded-md space-y-3 relative bg-muted/30">
                             <div className="absolute top-2 right-2">
                                 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(q.id)}>
                                     <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                                 </Button>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pr-8">
                                 <div className="md:col-span-2 space-y-1">
                                     <Label>Question Text</Label>
                                     <Input value={q.text} onChange={e => updateQuestion(q.id, 'text', e.target.value)} placeholder="e.g. Have you ever been denied a visa?" />
                                 </div>
                                 <div className="space-y-1">
                                     <Label>Answer Type</Label>
                                     <Select value={q.type} onValueChange={v => updateQuestion(q.id, 'type', v)}>
                                         <SelectTrigger><SelectValue /></SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="text">Text Input</SelectItem>
                                             <SelectItem value="boolean">Yes/No</SelectItem>
                                             <SelectItem value="date">Date</SelectItem>
                                             <SelectItem value="select">Dropdown</SelectItem>
                                         </SelectContent>
                                     </Select>
                                 </div>
                                 <div className="flex items-center pt-8 space-x-2">
                                     <Checkbox checked={q.required} onCheckedChange={c => updateQuestion(q.id, 'required', c)} />
                                     <Label>Required</Label>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </CardContent>
             </Card>
        </TabsContent>

      </Tabs>
      
      {/* Footer Save Button for convenience */}
      <div className="flex justify-end gap-4 border-t pt-6">
           <Button variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
           <Button size="lg" onClick={handleSubmit} disabled={isSubmitting} className="min-w-[150px]">
               {isSubmitting ? "Saving..." : "Save Visa Configuration"}
           </Button>
      </div>
    </div>
  );
}
