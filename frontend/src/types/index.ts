// ============ AUTH ============
export type UserRole = 'citizen' | 'admin' | 'kyc';

export interface CitizenUser {
  cnp: string;
  name?: string;
  firstName?: string;
  idSeries?: string;
  idNumber?: string;
  address?: string;
  expiryDate?: string;
  // Romanian property aliases used across the frontend and OCR
  nume?: string;
  prenume?: string;
  serie?: string;
  numar?: string;
  adresa?: string;
  data_expirare?: string;
  dataExpirare?: string;
  email?: string;
}

// ============ TAXES ============
export type TaxCategory = 'IMPOZIT' | 'TAXA' | 'AMENDA';
export type TaxStatus = 'PAID' | 'UNPAID';
export type ContestationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

export interface Tax {
  id: string;
  citizenCnp: string;
  type: string;
  title?: string;
  category: TaxCategory;
  amount: number;
  dueDate: string;
  isPaid?: boolean;
  paid?: boolean;
  paidAt: string | null;
  status: TaxStatus;
  issuedBy?: string | null;
  processNumber?: string | null;
  issuedDate?: string | null;
  contestation?: string | null;
  contestationStatus?: ContestationStatus;
  contestationResponse?: string | null;
  discountDeadline?: string | null;
}

// ============ DOCUMENTS ============
export type DocumentType = 
  | 'Certificat de Domiciliu'
  | 'Certificat de Atestare Fiscala'
  | 'Certificat de Urbanism'
  | 'Adeverinta'
  | 'Certificat de Nastere'
  | 'Certificat de Casatorie'
  | string;

export interface OfficialDocument {
  id: string;
  ownerName?: string;
  ownerCnp?: string;
  citizenName?: string;
  citizenCnp?: string;
  documentType: string;
  status?: string;
  registrationNumber?: string | null;
  purpose?: string | null;
  validUntil?: string | null;
  qrVerificationCode?: string | null;
  issuedAt?: string | null;
  issueDate?: string | null;
}

// ============ REQUESTS / SESIZARI ============
export type RequestStatus = 'INREGISTRATA' | 'IN_LUCRU' | 'REZOLVATA' | 'RESPINSA' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type RequestCategory = 'INFRASTRUCTURA' | 'CURATENIE' | 'ILUMINAT' | 'ZGOMOT' | 'ALTELE' | string;
export type UrgencyLevel = 'SCAZUTA' | 'MEDIE' | 'RIDICATA' | 'CRITICA' | string;

export interface Request {
  id: string;
  citizenName: string;
  citizenEmail: string;
  citizenCnp: string;
  title: string;
  description: string;
  category?: RequestCategory;
  urgency?: UrgencyLevel;
  status: RequestStatus;
  officialResponse?: string | null;
  resolutionText?: string | null;
  attachmentUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  aiCategory?: string;
  aiUrgency?: string;
  aiDepartment?: string;
  aiSentiment?: string;
  aiLocation?: string;
  aiSummary?: string;
  latitude?: number;
  longitude?: number;
}

export interface RequestEvent {
  id: string;
  requestId: string;
  eventType: string;
  description: string;
  performedBy?: string;
  createdAt: string;
}

// ============ PUBLIC SERVICE REQUESTS ============
export interface PublicServiceRequest {
  id: string;
  citizenCnp: string;
  citizenName: string;
  citizenEmail?: string;
  serviceType: string;
  subType?: string;
  details: string;
  status: string;
  adminResponse?: string | null;
  resolutionMessage?: string | null;
  createdAt: string;
}

// ============ CITY ALERTS ============
export interface CityAlert {
  id: string;
  title: string;
  description: string;
  category?: string;
  type: string;
  latitude: number;
  longitude: number;
  reportedBy?: string;
  status?: string;
  createdAt: string;
}

// ============ APPOINTMENTS ============
export interface Appointment {
  id: string;
  citizenCnp: string;
  citizenName: string;
  department?: string;
  appointmentDate: string;
  timeSlot?: string;
  purpose?: string;
  status: string;
  notes?: string | null;
}

// ============ POLLS ============
export interface PollOption {
  id?: string;
  text?: string;
  votes?: number;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  voteCounts?: Record<number, number>;
  totalVotes: number;
  active?: boolean;
  status?: string;
  createdAt?: string;
}

// ============ CHAT ============
export type MessageSender = 'user' | 'bot';

export interface ChatMessage {
  id?: string;
  text: string;
  sender: MessageSender;
  timestamp?: Date;
}

// ============ OCR ============
export interface OcrResult {
  nume: string | null;
  prenume: string | null;
  cnp: string | null;
  serie: string | null;
  numar: string | null;
  adresa: string | null;
  dataExpirare?: string | null;
  data_expirare?: string | null;
}

// ============ ADMIN ============
export interface AdminStats {
  total: number;
  inLucru: number;
  rezolvate: number;
  inregistrate: number;
}
