export type VisaType = 'Single' | 'Multiple' | 'Double';
export type ApplicationMethod = 'Online' | 'Offline';

export interface VisaDocument {
  id: string;
  name: string;
  category: 'Personal' | 'Relationship' | 'Financial' | 'Travel';
  isMandatory: boolean;
  description?: string;
}

export interface Visa {
  id: string;
  name: string;
  price: number;
  currency: string;
  type: VisaType;
  stayDuration: string; // e.g., "30 Days"
  extension: string; // e.g., "Extendable 1x"
  processingTime: string; // e.g., "3-5 Working Days"
  applicationMethod: ApplicationMethod;
  documents: VisaDocument[];
  needPhysicalPassport: boolean;
  appointedCity?: string;
  historyRequirement?: string;
  country: string;
  category?: 'First Time' | 'Extension';
  createdAt: string;
  updatedAt: string;
}
