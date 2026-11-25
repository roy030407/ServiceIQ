export type UserRole = 'owner' | 'dispatcher' | 'technician' | 'accounts';
export type OrgType = 'retailer' | 'wholesaler' | 'service_centre' | 'brand' | 'facility';
export type JobStatus =
  | 'open'
  | 'assigned'
  | 'en_route'
  | 'on_site'
  | 'awaiting_parts'
  | 'closed'
  | 'cancelled'
  | 'scheduled'
  | 'skipped';
export type Priority = 'P1' | 'P2' | 'P3';
export type TicketSource = 'phone' | 'whatsapp' | 'email' | 'portal' | 'walk_in';
export type TicketStatus = 'open' | 'in_progress' | 'awaiting_parts' | 'closed';
export type ContractType = 'comprehensive' | 'non_comprehensive' | 'labour_only';
export type EngagementType = 'employee' | 'contractor' | 'marketplace';

export interface Organisation {
  org_id: string;
  name: string;
  org_type: OrgType;
  day_start?: string;
  day_end?: string;
  working_days?: string;
  plan?: string;
  created_at?: string;
}

export interface Person {
  person_id: string;
  auth_user_id?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  base_city?: string | null;
  lang_pref?: string;
  phone_verified?: boolean;
  id_verified?: boolean;
  joined_at?: string;
}

export interface OrgMembership {
  membership_id: string;
  person_id: string;
  org_id: string;
  role: UserRole;
  engagement_type?: EngagementType;
  emp_code?: string | null;
  is_active: boolean;
  joined_at?: string;
  organisation?: Organisation;
}

export interface Party {
  party_id: string;
  org_id: string;
  name: string;
  party_type: 'customer' | 'dealer' | 'brand' | 'vendor';
  gstin?: string | null;
  phone?: string | null;
  attributes?: Record<string, unknown>;
  created_at?: string;
}

export interface Site {
  site_id: string;
  party_id: string;
  name: string;
  address?: string | null;
  pincode?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
  created_at?: string;
}

export interface EquipmentUnit {
  unit_id: string;
  org_id: string;
  model_id?: string | null;
  site_id?: string | null;
  sold_to_party_id?: string | null;
  serial_no?: string | null;
  sold_on?: string | null;
  installed_on?: string | null;
  warranty_end?: string | null;
  status: 'in_stock' | 'sold' | 'installed' | 'under_repair' | 'scrapped';
  attributes?: Record<string, unknown>;
  created_at?: string;
}

export interface WorkflowState {
  state_id: string;
  job_type_id: string;
  code: string;
  label: string;
  allowed_next: string[];
  is_initial: boolean;
  is_terminal: boolean;
  stops_sla_clock: boolean;
}

export interface JobType {
  job_type_id: string;
  org_id: string;
  code: string;
  name: string;
  checklist_schema?: unknown[];
  requires_signature?: boolean;
  requires_parts?: boolean;
}

export interface Ticket {
  ticket_id: string;
  org_id: string;
  site_id?: string | null;
  unit_id?: string | null;
  ticket_no: string;
  public_token: string;
  source: TicketSource;
  fault_description?: string | null;
  priority: Priority;
  reported_at: string;
  status: TicketStatus;
  created_at?: string;
  site?: {
    name: string;
    party?: {
      name: string;
      phone?: string | null;
    } | null;
  } | null;
  equipment_unit?: {
    serial_no?: string | null;
    product_model?: {
      name: string;
      brand_name?: string | null;
    } | null;
  } | null;
}

export interface JobAssignment {
  assignment_id: string;
  job_id: string;
  person_id: string;
  required_skill_id?: string | null;
  slot_start?: string | null;
  slot_end?: string | null;
  status: 'offered' | 'accepted' | 'declined' | 'completed';
  is_lead: boolean;
  payout_amount?: number | null;
  offered_at?: string;
  responded_at?: string | null;
  person?: {
    full_name: string;
    phone?: string | null;
  } | null;
}

export interface JobStatusEvent {
  event_id: string;
  job_id: string;
  from_state_id?: string | null;
  to_state_id?: string | null;
  changed_by?: string | null;
  changed_at: string;
  geo_lat?: number | null;
  geo_lng?: number | null;
  synced_offline?: boolean;
  from_state?: { code: string; label: string } | null;
  to_state?: { code: string; label: string } | null;
  person?: { full_name: string } | null;
}

export interface Job {
  job_id: string;
  org_id: string;
  ticket_id?: string | null;
  pm_visit_id?: string | null;
  unit_id?: string | null;
  job_type_id: string;
  current_state_id: string;
  job_no: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  response_due?: string | null;
  resolution_due?: string | null;
  paused_minutes?: number;
  breached?: boolean;
  customer_rating?: number | null;
  customer_feedback?: string | null;
  checklist_answers?: Record<string, unknown>;
  attachment_urls?: string[];
  signature_url?: string | null;
  technician_notes?: string | null;
  created_at: string;
  job_type?: {
    code: string;
    name: string;
  } | null;
  workflow_state?: {
    code: string;
    label: string;
    is_terminal?: boolean;
    allowed_next?: string[];
    stops_sla_clock?: boolean;
  } | null;
  ticket?: {
    priority: Priority;
    fault_description?: string | null;
    ticket_no?: string;
    site?: {
      name: string;
      party?: {
        name: string;
        phone?: string | null;
      } | null;
    } | null;
    equipment_unit?: {
      serial_no?: string | null;
      product_model?: {
        name: string;
        brand_name?: string | null;
      } | null;
    } | null;
  } | null;
  equipment_unit?: {
    unit_id?: string;
    serial_no?: string | null;
    site?: {
      name: string;
      party?: {
        name: string;
        phone?: string | null;
      } | null;
    } | null;
    product_model?: {
      name: string;
      brand_name?: string | null;
    } | null;
  } | null;
  job_assignment?: JobAssignment[] | null;
}


// Track E: Spare parts catalogue
export interface Part {
  part_id: string;
  org_id: string;
  part_no?: string | null;
  name: string;
  uom: string;
  sell_price: number;
}

// Track E: Contract renewal pipeline
export interface RenewalPipelineItem {
  org_id: string;
  contract_id: string;
  contract_no: string;
  valid_to: string;
  annual_value: number;
  status: string;
  customer_name: string;
  customer_phone?: string | null;
  days_until_expiry: number;
  equipment_count: number;
}
