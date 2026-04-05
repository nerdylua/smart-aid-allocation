// Database types matching our schema (supabase/migrations/001_initial_schema.sql)
// These are manually maintained until we connect to a live Supabase instance
// and can use `supabase gen types typescript`

export type UserRole = "admin" | "coordinator" | "field_worker" | "volunteer";
export type CaseSource = "form" | "csv" | "api" | "helpline" | "sms";
export type MessageStatus = "pending" | "promoted" | "dismissed";
export type CaseStatus =
  | "new"
  | "triaged"
  | "matched"
  | "assigned"
  | "in_progress"
  | "completed"
  | "closed";
export type AssignmentStatus =
  | "assigned"
  | "accepted"
  | "rejected"
  | "in_progress"
  | "completed"
  | "closed";
export type VerificationOutcome = "confirmed" | "partial" | "failed";

// Volunteer status dimensions
export type StaffingStatus = "available" | "on_shift" | "delayed" | "committed" | "unavailable";
export type ActionStatus = "idle" | "responding" | "on_scene" | "returning";

// Case notes
export type NoteType = "comment" | "status_change" | "system" | "escalation";

export interface Organization {
  id: string;
  name: string;
  type: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string | null;
  role: UserRole;
  email: string;
  name: string;
  language: string;
  skills: string[];
  location: { lat: number; lng: number } | null;
  availability: { available: boolean; [key: string]: unknown };
  staffing: StaffingStatus;
  action: ActionStatus;
  status_updated_at: string | null;
  created_at: string;
}

export interface NeedItem {
  type: string;
  detail?: string;
}

export interface PersonInfo {
  name?: string;
  age?: number;
  gender?: string;
  family_size?: number;
  vulnerabilities?: string[];
  contact?: string;
}

export interface Case {
  id: string;
  org_id: string | null;
  source_channel: CaseSource;
  title: string;
  description: string | null;
  location: { lat: number; lng: number } | null;
  location_label: string | null;
  needs: NeedItem[];
  person_info: PersonInfo;
  status: CaseStatus;
  language: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  case_id: string;
  severity: number;
  vulnerability: number;
  confidence: number;
  freshness: number;
  priority_score: number;
  rationale: string;
  is_flagged: boolean;
  flagged_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  case_id: string;
  volunteer_id: string;
  status: AssignmentStatus;
  match_rationale: string | null;
  match_score: number | null;
  sla_deadline: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Verification {
  id: string;
  assignment_id: string;
  proof_notes: string | null;
  proof_media_url: string | null;
  verified_by: string | null;
  outcome: VerificationOutcome;
  created_at: string;
}

export interface Feedback {
  id: string;
  case_id: string;
  assignment_id: string | null;
  rating: number;
  comments: string | null;
  submitted_by: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type IncidentStatus = "active" | "monitoring" | "resolved" | "closed";

export interface Incident {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  status: IncidentStatus;
  location_label: string | null;
  location: { lat: number; lng: number } | null;
  started_at: string;
  resolved_at: string | null;
  target_cases: number | null;
  org_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  channel: string;
  sender: string;
  body: string;
  status: MessageStatus;
  promoted_case_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ItineraryStatus = "planned" | "in_progress" | "completed";

export interface Itinerary {
  id: string;
  volunteer_id: string;
  name: string | null;
  status: ItineraryStatus;
  planned_date: string;
  assignments: string[];
  total_distance_km: number | null;
  estimated_hours: number | null;
  created_at: string;
}

export interface DispatchRule {
  id: string;
  name: string;
  condition_min_severity: number;
  condition_max_severity: number;
  condition_min_priority: number;
  sla_hours: number;
  auto_escalate: boolean;
  notify_channels: string[];
  is_active: boolean;
  created_at: string;
}

export interface CaseNote {
  id: string;
  case_id: string;
  author_id: string | null;
  author_name: string | null;
  content: string;
  note_type: NoteType;
  created_at: string;
}

// Supabase Database type mapping
// Insert types: required fields mandatory, rest optional
// Update types: all fields optional

export type OrganizationInsert = { name: string; id?: string; type?: string | null; settings?: Record<string, unknown>; created_at?: string };
export type OrganizationUpdate = Partial<Organization>;

export type UserInsert = { email: string; name: string; id?: string; org_id?: string | null; role?: UserRole; language?: string; skills?: string[]; location?: { lat: number; lng: number } | null; availability?: { available: boolean; [key: string]: unknown }; staffing?: StaffingStatus; action?: ActionStatus; status_updated_at?: string; created_at?: string };
export type UserUpdate = Partial<User>;

export type CaseInsert = { title: string; id?: string; org_id?: string | null; source_channel?: CaseSource; description?: string | null; location?: { lat: number; lng: number } | null; location_label?: string | null; needs?: NeedItem[]; person_info?: PersonInfo; status?: CaseStatus; language?: string; created_by?: string | null; created_at?: string; updated_at?: string };
export type CaseUpdate = Partial<Case>;

export type AssessmentInsert = { case_id: string; severity: number; vulnerability: number; confidence: number; freshness: number; rationale: string; id?: string; is_flagged?: boolean; flagged_reason?: string | null; reviewed_by?: string | null; reviewed_at?: string | null; created_at?: string };
export type AssessmentUpdate = Partial<Assessment>;

export type AssignmentInsert = { case_id: string; volunteer_id: string; id?: string; status?: AssignmentStatus; match_rationale?: string | null; match_score?: number | null; sla_deadline?: string | null; accepted_at?: string | null; completed_at?: string | null; created_at?: string };
export type AssignmentUpdate = Partial<Assignment>;

export type VerificationInsert = { assignment_id: string; outcome: VerificationOutcome; id?: string; proof_notes?: string | null; proof_media_url?: string | null; verified_by?: string | null; created_at?: string };
export type VerificationUpdate = Partial<Verification>;

export type FeedbackInsert = { case_id: string; rating: number; id?: string; assignment_id?: string | null; comments?: string | null; submitted_by?: string | null; created_at?: string };
export type FeedbackUpdate = Partial<Feedback>;

export type AuditEventInsert = { entity_type: string; entity_id: string; action: string; id?: string; actor_id?: string | null; metadata?: Record<string, unknown>; created_at?: string };
export type AuditEventUpdate = Partial<AuditEvent>;

export type IncidentInsert = { name: string; id?: string; type?: string | null; description?: string | null; status?: IncidentStatus; location_label?: string | null; started_at?: string; resolved_at?: string | null; target_cases?: number | null; org_id?: string | null; created_at?: string };
export type IncidentUpdate = Partial<Incident>;

export type MessageInsert = { channel: string; sender: string; body: string; id?: string; status?: MessageStatus; promoted_case_id?: string | null; metadata?: Record<string, unknown>; created_at?: string };
export type MessageUpdate = Partial<Message>;

export type CaseNoteInsert = { case_id: string; content: string; id?: string; author_id?: string | null; author_name?: string | null; note_type?: NoteType; created_at?: string };
export type CaseNoteUpdate = Partial<CaseNote>;

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: OrganizationInsert; Update: OrganizationUpdate; Relationships: [] };
      users: { Row: User; Insert: UserInsert; Update: UserUpdate; Relationships: [] };
      cases: { Row: Case; Insert: CaseInsert; Update: CaseUpdate; Relationships: [] };
      assessments: { Row: Assessment; Insert: AssessmentInsert; Update: AssessmentUpdate; Relationships: [] };
      assignments: { Row: Assignment; Insert: AssignmentInsert; Update: AssignmentUpdate; Relationships: [] };
      verifications: { Row: Verification; Insert: VerificationInsert; Update: VerificationUpdate; Relationships: [] };
      feedback: { Row: Feedback; Insert: FeedbackInsert; Update: FeedbackUpdate; Relationships: [] };
      audit_events: { Row: AuditEvent; Insert: AuditEventInsert; Update: AuditEventUpdate; Relationships: [] };
      case_notes: { Row: CaseNote; Insert: CaseNoteInsert; Update: CaseNoteUpdate; Relationships: [] };
      messages: { Row: Message; Insert: MessageInsert; Update: MessageUpdate; Relationships: [] };
      incidents: { Row: Incident; Insert: IncidentInsert; Update: IncidentUpdate; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
