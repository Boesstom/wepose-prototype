export type VisaType = 'Single' | 'Multiple' | 'Double' | 'Custom';
export type ApplicationMethod = 'Online' | 'Offline';

export interface VisaDocumentConfig {
  photo_size?: string;
  passport_min_validity_months?: number;
  original_required?: boolean;
  color_copy_required?: boolean;
  digital_copy_required?: boolean;
  remarks?: string;
}

export interface VisaDocument {
  id: string;
  name: string;
  category: 'Personal' | 'Relationship' | 'Financial' | 'Travel' | 'Other';
  isMandatory: boolean;
  notes?: string; // Additional notes specific to this visa
  config?: VisaDocumentConfig; // Document configuration/rules
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'discount' | 'special_price';
  value: number; // Amount for special_price, or discount amount
  discountType?: 'percentage' | 'nominal'; // Only if type is 'discount'
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface PricingBreakdown {
  embassy_price: number;
  center_price: number;
  service_fee: number;
  other_fees: { name: string; amount: number }[];
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'boolean' | 'select' | 'date';
  options?: string[];
  required: boolean;
}

export interface Visa {
  id: string;
  name: string;
  country: string;
  
  // Basic Info
  purpose?: string; // New: e.g. "Tourist", "Business"
  category?: 'First Time' | 'Extension';
  type: VisaType;

  // Processing & Validity
  stayDuration: string; // e.g., "30 Days"
  validity: string; // "90 Days"
  processingTime: string; // "3-5 Working Days"
  
  // Detailed Processing Config
  processing_time_type?: 'fix' | 'range';
  processing_time_fix?: number;
  processing_time_min?: number;
  processing_time_max?: number;

  process_internal_type?: 'fix' | 'range';
  process_internal_fix?: number;
  process_internal_min?: number;
  process_internal_max?: number;

  process_center_type?: 'fix' | 'range';
  process_center_fix?: number;
  process_center_min?: number;
  process_center_max?: number;

  validity_type?: 'fix' | 'range';
  validity_fix?: number;
  validity_min?: number;
  validity_max?: number;
  
  stay_duration_type?: 'fix' | 'range';
  stay_duration_fix?: number;
  stay_duration_min?: number;
  stay_duration_max?: number;
  stay_duration?: number; // Legacy or calculated display
  earliest_apply_time?: number;

  // Pricing
  currency: string;
  price: number; // Final Total Price (FIT)
  priceAgent?: number;
  pricingRules?: PricingRule[];
  pricing_breakdown?: PricingBreakdown; 

  // Location & Method
  applicationMethod: ApplicationMethod;
  is_need_appointment: boolean;
  is_applicant_presence_required: boolean;
  needPhysicalPassport: boolean;
  location_type?: 'appointed' | 'available';
  appointedCity?: string;
  appointed_cities_list?: string[];
  available_cities_list?: string[];

  // Requirements & Eligibility
  requirements_data?: any; // JSON structure for flexible requirements
  job_requirement?: string;
  marriage_requirement?: string;
  relationship_requirement?: string;
  history_requirement?: string;
  min_age?: number;
  max_age?: number;
  allowed_sponsors?: string[];
  sponsor_other_details?: string;

  // Documents & Questions
  documents: VisaDocument[];
  questions_data?: Question[]; // Additional questions for form

  createdAt: string;
  updatedAt: string;
}
