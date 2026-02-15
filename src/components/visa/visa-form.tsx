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
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    CheckmarkCircle01Icon, 
    PassportIcon, 
    DocumentValidationIcon, 
    Settings01Icon,
    Globe02Icon,
    Loading03Icon
} from "@hugeicons/core-free-icons";

// Supabase Imports
import { getCountries, getCities, type Address } from "@/lib/supabase/addresses";
import { getDocuments, type Document } from "@/lib/supabase/documents";
import { createVisa, updateVisa, getVisaById } from "@/lib/supabase/visas";

const SPONSOR_TYPES = [
    "Diri Sendiri",
    "Keluarga Inti",
    "Perusahaan/Kantor",
    "Invitation",
    "Lain-lain"
];

// Extended Document Type for Form State
type FormDocument = Document & {
    isSelected: boolean;
    isMandatory: boolean;
    notes: string;
};

interface FormData {
  // Basic Information
  name: string;
  country: string;
  price: string;
  currency: string;
  type: string;
  category?: 'First Time' | 'Extension';

  // Durations & Times (Integers for days, Date for dates)
  // Lama Proses
  processingTimeType: 'fix' | 'range';
  processingTimeFix?: string; // integer
  processingTimeMin?: string; // integer
  processingTimeMax?: string; // integer

  // Masa Berlaku
  validityType: 'fix' | 'range';
  validityFix?: string; // integer (days)
  validityMin?: string; // integer (days)
  validityMax?: string; // integer (days)

  stayDuration: string; // integer (days) "Lama masa stay"
  earliestApplyTime: string; // integer (days) "Waktu tercepat apply"
  
  // Operational Details
  isNeedAppointment: boolean;
  isApplicantPresenceRequired: boolean; // "is perlu kehadiran orangnya sendiri"
  applicationMethod: string; // Online, Offline
  
  // Location (Offline only)
  locationType: 'appointed' | 'available';
  appointedCity?: string; // Kept for the main "Appointed City" input if needed
  appointedCitiesList: string[]; // List of cities for appointed
  availableCitiesList: string[]; // List of cities for available
  
  needPhysicalPassport: boolean;

  // Requirements (Syarat)
  // Status Requirements
  jobRequirement: string;
  marriageRequirement: string;
  minAge?: string; // integer
  maxAge?: string; // integer
  relationshipRequirement: string;
  historyRequirement: string;
  
  // Sponsors
  allowedSponsors: string[];
  sponsorOtherDetails: string; // New: Details for "Lain-lain"

  // Documents (selection state maintained in separate local state or merged here)
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
  const [documents, setDocuments] = useState<FormDocument[]>([]);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    name: "",
    country: "",
    price: "",
    currency: "IDR",
    type: "Single",
    category: categoryParam || undefined,
    
    processingTimeType: 'fix',
    processingTimeFix: "",
    processingTimeMin: "",
    processingTimeMax: "",
    
    validityType: 'fix',
    validityFix: "",
    validityMin: "",
    validityMax: "",
    
    stayDuration: "",
    earliestApplyTime: "",
    
    isNeedAppointment: false,
    isApplicantPresenceRequired: false,
    applicationMethod: "Online",
    
    locationType: "appointed",
    appointedCity: "",
    appointedCitiesList: [],
    availableCitiesList: [],
    
    needPhysicalPassport: false,
    
    jobRequirement: "",
    marriageRequirement: "",
    minAge: "",
    maxAge: "",
    relationshipRequirement: "",
    historyRequirement: "",
    
    allowedSponsors: [],
    sponsorOtherDetails: "",
  });

  // Fetch Data on Mount (Master + Edit Data)
  useEffect(() => {
      async function loadData() {
          try {
              // 1. Fetch Master Data
              const [countriesData, citiesData, docsData] = await Promise.all([
                  getCountries(),
                  getCities(),
                  getDocuments()
              ]);
              setMasterCountries(countriesData);
              setMasterCities(citiesData);
              
              let initialDocs = docsData.map(d => ({
                  ...d,
                  isSelected: false,
                  isMandatory: false,
                  notes: ""
              }));

              // 2. Fetch Visa if ID present (Edit Mode)
              if (visaId) {
                  const visa = await getVisaById(visaId);
                  if (visa) {
                      // Map to FormData
                      setFormData({
                          name: visa.name,
                          country: visa.country,
                          price: visa.price.toString(),
                          currency: visa.currency,
                          type: visa.type,
                          category: (visa.category as any) || undefined,
                          
                          processingTimeType: (visa.processing_time_type as any) || 'fix',
                          processingTimeFix: visa.processing_time_fix?.toString() || "",
                          processingTimeMin: visa.processing_time_min?.toString() || "",
                          processingTimeMax: visa.processing_time_max?.toString() || "",
                          
                          validityType: (visa.validity_type as any) || 'fix',
                          validityFix: visa.validity_fix?.toString() || "",
                          validityMin: visa.validity_min?.toString() || "",
                          validityMax: visa.validity_max?.toString() || "",
                          
                          stayDuration: visa.stay_duration?.toString() || "",
                          earliestApplyTime: visa.earliest_apply_time?.toString() || "",
                          
                          isNeedAppointment: visa.is_need_appointment,
                          isApplicantPresenceRequired: visa.is_applicant_presence_required,
                          applicationMethod: visa.application_method,
                          
                          locationType: (visa.location_type as any) || 'appointed',
                          appointedCity: visa.appointed_city || "",
                          appointedCitiesList: visa.appointed_cities_list || [],
                          availableCitiesList: visa.available_cities_list || [],
                          
                          needPhysicalPassport: visa.need_physical_passport,
                          
                          jobRequirement: visa.job_requirement || "",
                          marriageRequirement: visa.marriage_requirement || "",
                          minAge: visa.min_age?.toString() || "",
                          maxAge: visa.max_age?.toString() || "",
                          relationshipRequirement: visa.relationship_requirement || "",
                          historyRequirement: visa.history_requirement || "",
                          
                          allowedSponsors: visa.allowed_sponsors || [],
                          sponsorOtherDetails: visa.sponsor_other_details || "",
                      });

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
                                  notes: vd.notes || "" 
                              };
                          }
                          return d;
                      });
                  }
              }

              setDocuments(initialDocs);
          } catch (error) {
              console.error("Failed to load data", error);
              // alert("Failed to load required data.");
          } finally {
              setIsLoadingMaster(false);
          }
      }
      loadData();
  }, [visaId]);

  // Searchable select options
  const countryOptions: SearchableSelectOption[] = useMemo(() => 
    masterCountries.map(c => ({
      value: c.name,
      label: c.name,
      icon: c.flag ? <span>{c.flag}</span> : undefined,
    })), [masterCountries]);

  const cityOptions: SearchableSelectOption[] = useMemo(() => 
    masterCities.map(city => {
      const country = masterCountries.find(c => c.id === city.parent_id);
      return {
        value: city.name,
        label: `${city.name}${country ? ` (${country.name})` : ''}`,
      };
    }), [masterCities, masterCountries]);

  // Filtered city options
  const appointedCityOptions = useMemo(() => 
    cityOptions.filter(opt => !formData.appointedCitiesList.includes(opt.value)),
    [cityOptions, formData.appointedCitiesList]);

  const availableCityOptions = useMemo(() => 
    cityOptions.filter(opt => !formData.availableCitiesList.includes(opt.value)),
    [cityOptions, formData.availableCitiesList]);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSponsor = (sponsor: string) => {
    setFormData(prev => {
        const current = prev.allowedSponsors;
        if (current.includes(sponsor)) {
            return { ...prev, allowedSponsors: current.filter(s => s !== sponsor) };
        } else {
            return { ...prev, allowedSponsors: [...current, sponsor] };
        }
    });
  };

  const toggleDocument = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, isSelected: !doc.isSelected } : doc
      )
    );
  };

  const toggleDocumentMandatory = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, isMandatory: !doc.isMandatory } : doc
      )
    );
  };

  const updateDocumentNote = (id: string, note: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, notes: note } : doc
      )
    );
  };

  const addCity = (field: 'appointedCitiesList' | 'availableCitiesList', city: string) => {
    if (!city.trim()) return;
    setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], city]
    }));
  };

  const removeCity = (field: 'appointedCitiesList' | 'availableCitiesList', index: number) => {
    setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
       if (!formData.name || !formData.country || !formData.price) {
           alert("Please fill in required fields (Name, Country, Price)");
           return;
       }

       setIsSubmitting(true);
       try {
           // Prepare visa object for Supabase
           const visaInput = {
               name: formData.name,
               country: formData.country,
               price: parseFloat(formData.price) || 0,
               currency: formData.currency,
               type: formData.type,
               category: formData.category || null,
               
               // Times
               stay_duration: parseInt(formData.stayDuration) || null,
               earliest_apply_time: parseInt(formData.earliestApplyTime) || null,
               
               processing_time_type: formData.processingTimeType,
               processing_time_fix: formData.processingTimeType === 'fix' ? (parseInt(formData.processingTimeFix || "0") || null) : null,
               processing_time_min: formData.processingTimeType === 'range' ? (parseInt(formData.processingTimeMin || "0") || null) : null,
               processing_time_max: formData.processingTimeType === 'range' ? (parseInt(formData.processingTimeMax || "0") || null) : null,
               
               validity_type: formData.validityType,
               validity_fix: formData.validityType === 'fix' ? (parseInt(formData.validityFix || "0") || null) : null,
               validity_min: formData.validityType === 'range' ? (parseInt(formData.validityMin || "0") || null) : null,
               validity_max: formData.validityType === 'range' ? (parseInt(formData.validityMax || "0") || null) : null,
               
               // Operational
               application_method: formData.applicationMethod,
               is_need_appointment: formData.isNeedAppointment,
               is_applicant_presence_required: formData.isApplicantPresenceRequired,
               need_physical_passport: formData.needPhysicalPassport,
               
               // Location
               location_type: formData.applicationMethod === 'Offline' ? formData.locationType : null,
               appointed_city: formData.applicationMethod === 'Offline' && formData.locationType === 'appointed' ? formData.appointedCity || null : null,
               appointed_cities_list: formData.applicationMethod === 'Offline' && formData.locationType === 'appointed' ? formData.appointedCitiesList : [],
               available_cities_list: formData.applicationMethod === 'Offline' && formData.locationType === 'available' ? formData.availableCitiesList : [],
               
               // Requirements
               job_requirement: formData.jobRequirement || null,
               marriage_requirement: formData.marriageRequirement || null,
               relationship_requirement: formData.relationshipRequirement || null,
               history_requirement: formData.historyRequirement || null,
               min_age: parseInt(formData.minAge || "0") || null,
               max_age: parseInt(formData.maxAge || "0") || null,
               
               allowed_sponsors: formData.allowedSponsors,
               sponsor_other_details: formData.sponsorOtherDetails || null,
           };

           // Prepare documents mapping
           const selectedDocs = documents
               .filter(d => d.isSelected)
               .map(d => ({
                   document_id: d.id,
                   is_mandatory: d.isMandatory,
                   notes: d.notes
               }));

           if (visaId) {
               await updateVisa(visaId, visaInput, selectedDocs);
               alert("Visa updated successfully!");
           } else {
               await createVisa(visaInput, selectedDocs);
               alert("Visa created successfully!");
           }
           
           router.push('/dashboard/visa');
           
       } catch (error) {
           console.error("Submission failed", error);
           alert("Failed to save visa. See console for details.");
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      {/* Header Badge */}
      {formData.category && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-md font-medium flex items-center gap-2">
              <HugeiconsIcon icon={PassportIcon} className="size-5" strokeWidth={2} />
              {visaId ? "Editing Visa" : "Creating Visa for:"} {formData.category}
          </div>
      )}
      
      {/* 1. Basic Information & Validity */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={PassportIcon} className="size-5 text-primary" strokeWidth={2} />
                  Basic Information & Validity
              </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Fields */}
                <div className="space-y-2">
                  <Label htmlFor="name">Visa Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Tourist Visa"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <SearchableSelect
                    options={countryOptions}
                    value={formData.country}
                    onValueChange={(val) => updateFormData("country", val)}
                    placeholder="Select country"
                    searchPlaceholder="Search country..."
                    emptyMessage="No country found."
                    icon={<HugeiconsIcon icon={Globe02Icon} className="h-4 w-4 text-muted-foreground" strokeWidth={2} />}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (IDR)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => updateFormData("price", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Visa Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => updateFormData("type", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single Entry</SelectItem>
                      <SelectItem value="Multiple">Multiple Entry</SelectItem>
                      <SelectItem value="Double">Double Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Processing Time */}
                <div className="space-y-3 md:col-span-2 border p-4 rounded-md bg-muted/10">
                    <Label className="font-semibold text-base">Processing Time (Lama Proses)</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="processingTimeType"
                                checked={formData.processingTimeType === 'fix'}
                                onChange={() => updateFormData('processingTimeType', 'fix')}
                                className="accent-primary"
                            />
                            <span className="text-sm">Fix Day</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="processingTimeType"
                                checked={formData.processingTimeType === 'range'}
                                onChange={() => updateFormData('processingTimeType', 'range')}
                                className="accent-primary"
                            />
                            <span className="text-sm">Range Day</span>
                        </label>
                    </div>

                    {formData.processingTimeType === 'fix' ? (
                        <div className="flex items-center gap-2 max-w-xs">
                             <Input 
                                type="number" 
                                placeholder="Days" 
                                value={formData.processingTimeFix}
                                onChange={(e) => updateFormData('processingTimeFix', e.target.value)}
                             />
                             <span className="text-sm text-muted-foreground">Days</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 max-w-sm">
                                <Input 
                                    type="number" 
                                    placeholder="Min Days" 
                                    value={formData.processingTimeMin}
                                    onChange={(e) => updateFormData('processingTimeMin', e.target.value)}
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input 
                                    type="number" 
                                    placeholder="Max Days" 
                                    value={formData.processingTimeMax}
                                    onChange={(e) => updateFormData('processingTimeMax', e.target.value)}
                                />
                                <span className="text-sm text-muted-foreground">Days</span>
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                * Range depends on document strength (kekuatan dokumen).
                            </p>
                        </div>
                    )}
                </div>

                {/* Validity Period */}
                <div className="space-y-3 md:col-span-2 border p-4 rounded-md bg-muted/10">
                    <Label className="font-semibold text-base">Validity Period & Stay (Masa Berlaku)</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Validity */}
                         <div className="space-y-2">
                             <Label className="text-sm">Validity Duration</Label>
                             <div className="flex gap-4 mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="validityType"
                                        checked={formData.validityType === 'fix'}
                                        onChange={() => updateFormData('validityType', 'fix')}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm">Fix</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="validityType"
                                        checked={formData.validityType === 'range'}
                                        onChange={() => updateFormData('validityType', 'range')}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm">Range</span>
                                </label>
                            </div>
                            
                            {formData.validityType === 'fix' ? (
                                <div className="flex items-center gap-2">
                                     <Input 
                                        type="number" 
                                        placeholder="Validity Days" 
                                        value={formData.validityFix}
                                        onChange={(e) => updateFormData('validityFix', e.target.value)}
                                     />
                                     <span className="text-sm text-muted-foreground">Days</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        placeholder="Min" 
                                        value={formData.validityMin}
                                        onChange={(e) => updateFormData('validityMin', e.target.value)}
                                    />
                                    <span>-</span>
                                    <Input 
                                        type="number" 
                                        placeholder="Max" 
                                        value={formData.validityMax}
                                        onChange={(e) => updateFormData('validityMax', e.target.value)}
                                    />
                                    <span className="text-sm text-muted-foreground">Days</span>
                                </div>
                            )}
                         </div>

                         {/* Stay Duration */}
                         <div className="space-y-2">
                             <Label htmlFor="stayDuration" className="text-sm">Stay Duration (Lama Masa Stay)</Label>
                             <div className="flex items-center gap-2">
                                <Input
                                    id="stayDuration"
                                    type="number"
                                    placeholder="e.g. 30"
                                    value={formData.stayDuration}
                                    onChange={(e) => updateFormData("stayDuration", e.target.value)}
                                />
                                <span className="text-sm text-muted-foreground">Days</span>
                             </div>
                             <p className="text-[10px] text-muted-foreground">
                                Recommended based on Validity Period.
                             </p>
                         </div>
                         
                         {/* Earliest Apply Time */}
                         <div className="space-y-2">
                             <Label htmlFor="earliestApplyTime" className="text-sm">Earliest Apply Time (Waktu Tercepat Apply)</Label>
                             <div className="flex items-center gap-2">
                                <Input
                                    id="earliestApplyTime"
                                    type="number" // Assuming integer (days before)
                                    placeholder="e.g. 90"
                                    value={formData.earliestApplyTime}
                                    onChange={(e) => updateFormData("earliestApplyTime", e.target.value)}
                                />
                                <span className="text-sm text-muted-foreground">Days Before</span>
                             </div>
                         </div>
                    </div>
                </div>
          </CardContent>
      </Card>

      {/* 2. Operational & Location */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={Settings01Icon} className="size-5 text-primary" strokeWidth={2} />
                  Operational Details
              </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="applicationMethod">Application Method</Label>
                  <Select
                    value={formData.applicationMethod}
                    onValueChange={(val) => updateFormData("applicationMethod", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Location Logic - Only if Offline */}
                 <div className="space-y-2">
                  <Label className={formData.applicationMethod !== 'Offline' ? "text-muted-foreground" : ""}>
                    Location Apply (Lokasi)
                  </Label>
                  <div className={`space-y-2 border p-3 rounded-md transition-opacity ${formData.applicationMethod !== 'Offline' ? 'opacity-50 pointer-events-none' : ''}`}>
                       <div className="flex flex-col gap-2">

                            
                            <div className="p-3 border rounded-md bg-white">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input 
                                        type="radio" 
                                        name="locationType"
                                        checked={formData.locationType === 'appointed'}
                                        onChange={() => updateFormData('locationType', 'appointed')}
                                        disabled={formData.applicationMethod !== 'Offline'}
                                        className="accent-primary"
                                    />
                                    <span className="font-medium text-sm">Appointed City</span>
                                </label>
                                {formData.locationType === 'appointed' && (
                                    <div className="pl-6 space-y-2 animate-in fade-in slide-in-from-top-1">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Main City (Optional Display)</Label>
                                            <SearchableSelect
                                                options={cityOptions}
                                                value={formData.appointedCity}
                                                onValueChange={(val) => updateFormData('appointedCity', val)}
                                                placeholder="Select primary city"
                                                searchPlaceholder="Search city..."
                                                emptyMessage="No city found."
                                                triggerClassName="h-8 text-sm"
                                            />
                                        </div>
                                         <div className="space-y-2">
                                             <Label className="text-xs text-muted-foreground">List of Appointed Cities</Label>
                                             <SearchableSelect
                                                options={appointedCityOptions}
                                                value=""
                                                onValueChange={(val) => addCity('appointedCitiesList', val)}
                                                placeholder="Select city to add..."
                                                searchPlaceholder="Search city..."
                                                emptyMessage="No city found."
                                                triggerClassName="h-8 text-sm"
                                                resetAfterSelect
                                             />
                                             <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.appointedCitiesList.map((city, idx) => (
                                                    <Badge key={idx} variant="secondary" className="flex items-center gap-1 pr-1">
                                                        {city}
                                                        <span 
                                                            className="cursor-pointer hover:text-destructive ml-1"
                                                            onClick={() => removeCity('appointedCitiesList', idx)}
                                                        >×</span>
                                                    </Badge>
                                                ))}
                                             </div>
                                         </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-3 border rounded-md bg-white">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input 
                                        type="radio" 
                                        name="locationType"
                                        checked={formData.locationType === 'available'}
                                        onChange={() => updateFormData('locationType', 'available')}
                                        disabled={formData.applicationMethod !== 'Offline'}
                                        className="accent-primary"
                                    />
                                    <span className="font-medium text-sm">Based on Available City</span>
                                </label>
                                {formData.locationType === 'available' && (
                                    <div className="pl-6 animate-in fade-in slide-in-from-top-1 space-y-2">
                                         <div className="space-y-2">
                                             <Label className="text-xs text-muted-foreground">List of Available Cities</Label>
                                             <SearchableSelect
                                                options={availableCityOptions}
                                                value=""
                                                onValueChange={(val) => addCity('availableCitiesList', val)}
                                                placeholder="Select city to add..."
                                                searchPlaceholder="Search city..."
                                                emptyMessage="No city found."
                                                triggerClassName="h-8 text-sm"
                                                resetAfterSelect
                                             />
                                             <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.availableCitiesList.map((city, idx) => (
                                                    <Badge key={idx} variant="secondary" className="flex items-center gap-1 pr-1">
                                                        {city}
                                                        <span 
                                                            className="cursor-pointer hover:text-destructive ml-1"
                                                            onClick={() => removeCity('availableCitiesList', idx)}
                                                        >×</span>
                                                    </Badge>
                                                ))}
                                             </div>
                                         </div>
                                    </div>
                                )}
                            </div>
                       </div>
                  </div>
                </div>

                {/* Flags */}
                <div className="space-y-4 md:col-span-2">
                     <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                        <Checkbox 
                            id="isNeedAppointment" 
                            checked={formData.isNeedAppointment}
                            onCheckedChange={(checked) => updateFormData("isNeedAppointment", !!checked)}
                        />
                        <Label htmlFor="isNeedAppointment" className="cursor-pointer">Is Need Appointment?</Label>
                    </div>
                     <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                        <Checkbox 
                            id="isApplicantPresenceRequired" 
                            checked={formData.isApplicantPresenceRequired}
                            onCheckedChange={(checked) => updateFormData("isApplicantPresenceRequired", !!checked)}
                        />
                        <Label htmlFor="isApplicantPresenceRequired" className="cursor-pointer">Is Applicant Presence Required? (Perlu Kehadiran)</Label>
                    </div>
                     <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                        <Checkbox 
                            id="physicalPassport" 
                            checked={formData.needPhysicalPassport}
                            onCheckedChange={(checked) => updateFormData("needPhysicalPassport", !!checked)}
                        />
                        <Label htmlFor="physicalPassport" className="cursor-pointer">Physical Passport Required</Label>
                    </div>
                </div>
          </CardContent>
      </Card>
      
      {/* 3. Requirements (Syarat) & Documents */}
       <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={DocumentValidationIcon} className="size-5 text-primary" strokeWidth={2} />
                  Requirements (Syarat & Dokumen)
              </CardTitle>
              <CardDescription>
                  Define eligibility criteria (Status) and required documents.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
              {/* Status Requirements */}
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Status Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Job Requirement (Pekerjaan)</Label>
                            <Textarea 
                                placeholder="Describe job requirements..."
                                value={formData.jobRequirement}
                                onChange={(e) => updateFormData('jobRequirement', e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Marriage Requirement (Pernikahan)</Label>
                            <Textarea 
                                placeholder="Describe marriage status requirements..."
                                value={formData.marriageRequirement}
                                onChange={(e) => updateFormData('marriageRequirement', e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Relationship (Hubungan)</Label>
                            <Textarea 
                                placeholder="Describe relationship requirements..."
                                value={formData.relationshipRequirement}
                                onChange={(e) => updateFormData('relationshipRequirement', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                             <Label>Age (Umur)</Label>
                             <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    placeholder="Min Age" 
                                    value={formData.minAge}
                                    onChange={(e) => updateFormData('minAge', e.target.value)}
                                />
                                <span>-</span>
                                <Input 
                                    type="number" 
                                    placeholder="Max Age" 
                                    value={formData.maxAge}
                                    onChange={(e) => updateFormData('maxAge', e.target.value)}
                                />
                             </div>
                        </div>
                         <div className="space-y-2 md:col-span-2">
                            <Label>Application History (History Apply)</Label>
                            <Textarea 
                                placeholder="Any history requirements..."
                                value={formData.historyRequirement}
                                onChange={(e) => updateFormData('historyRequirement', e.target.value)}
                            />
                        </div>
                  </div>
              </div>
              
              {/* Sponsor */}
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Alllowed Sponsors</h3>
                  <div className="flex flex-wrap gap-4">
                      {SPONSOR_TYPES.map(sponsor => (
                          <div key={sponsor} className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`sponsor-${sponsor}`}
                                    checked={formData.allowedSponsors.includes(sponsor)}
                                    onCheckedChange={() => toggleSponsor(sponsor)}
                                  />
                                  <Label htmlFor={`sponsor-${sponsor}`} className="cursor-pointer">{sponsor}</Label>
                              </div>
                          </div>
                      ))}
                  </div>
                  {formData.allowedSponsors.includes("Lain-lain") && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="sponsorOtherDetails" className="text-sm mb-1.5 block">
                                Specification for 'Lain-lain' (Catatan)
                            </Label>
                            <Textarea 
                                id="sponsorOtherDetails"
                                placeholder="Please specify other sponsor details..."
                                value={formData.sponsorOtherDetails}
                                onChange={(e) => updateFormData("sponsorOtherDetails", e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>
                  )}
              </div>
              
              {/* Documents */}
              <div className="space-y-4">
                   <h3 className="font-semibold text-lg border-b pb-2">Document Requirements</h3>
                   <div className="grid grid-cols-1 gap-4">
                        {documents.map((doc) => (
                            <div
                            key={doc.id}
                            className={`flex flex-col space-y-2 p-3 rounded-md border transition-all ${
                                doc.isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-gray-300"
                            }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id={doc.id}
                                            checked={doc.isSelected}
                                            onCheckedChange={() => toggleDocument(doc.id)}
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor={doc.id} className="cursor-pointer font-medium leading-none flex items-center gap-2">
                                                {doc.name}
                                            </Label>
                                            <div className="flex flex-wrap gap-1">
                                                {doc.formats.map(fmt => (
                                                    <Badge key={fmt} variant="secondary" className="text-[10px] px-1 py-0 h-4">{fmt}</Badge>
                                                ))}
                                                {doc.allow_multiple && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Multiple</Badge>}
                                                {doc.sub_documents.length > 0 && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{doc.sub_documents.length} Sub-docs</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {doc.isSelected && (
                                        <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                                            <label className="text-xs flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                                <Checkbox 
                                                    checked={doc.isMandatory}
                                                    onCheckedChange={() => toggleDocumentMandatory(doc.id)}
                                                    className="h-3.5 w-3.5"
                                                />
                                                Mandatory
                                            </label>
                                        </div>
                                    )}
                                </div>
                                

                                    {doc.isSelected && (
                                        <div className="mt-3 pl-7 border-l-2 border-primary/20 ml-2 space-y-3">
                                            {/* Notes Input */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`note-${doc.id}`} className="text-xs text-muted-foreground">
                                                    Notes / Instructions for this document:
                                                </Label>
                                                <Input 
                                                    id={`note-${doc.id}`}
                                                    placeholder="e.g. Must be translated to English"
                                                    value={doc.notes}
                                                    onChange={(e) => updateDocumentNote(doc.id, e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                            </div>
                        ))}
                   </div>
              </div>
          </CardContent>
      </Card>
      
      {/* Submit Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 flex justify-end gap-3 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] md:pl-[250px]">
           <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
               Cancel
           </Button>
           <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-[120px]">
               {isSubmitting ? (
                   <>
                       <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2 size-4" />
                       Saving...
                   </>
               ) : (
                   <>
                       <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-2 size-4" strokeWidth={2} />
                       {visaId ? "Update Visa" : "Create Visa"}
                   </>
               )}
           </Button>
      </div>
    </div>
  );
}
