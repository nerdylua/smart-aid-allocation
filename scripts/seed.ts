/**
 * Seed script for Community Need Intelligence Grid
 * Based on Bengaluru metropolitan area coordinates
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Bengaluru area bounding box
const BENGALURU = { lat: 12.9716, lng: 77.5946 };
const jitter = (base: number, range: number) =>
  base + (Math.random() - 0.5) * range;

// ============================================================
// ORGANIZATIONS
// ============================================================
const organizations = [
  { name: "MedRelief India", type: "medical_relief" },
  { name: "Annapurna Food Bank", type: "food_bank" },
  { name: "Bengaluru Disaster Response Network", type: "disaster_response" },
  { name: "ShikshaSetu Education Trust", type: "education" },
];

// ============================================================
// USERS (coordinators + field workers + volunteers)
// ============================================================
const users = [
  // Coordinators
  { name: "Priya Sharma", email: "priya@medrelief.org", role: "coordinator", language: "hi", skills: ["medical_triage", "logistics"], orgIdx: 0 },
  { name: "Ravi Desai", email: "ravi@annapurna.org", role: "coordinator", language: "mr", skills: ["food_distribution", "inventory"], orgIdx: 1 },
  { name: "Sunita Patel", email: "sunita@bdrn.org", role: "coordinator", language: "hi", skills: ["emergency_management", "communication"], orgIdx: 2 },
  { name: "Amit Joshi", email: "amit@shikshasetu.org", role: "coordinator", language: "en", skills: ["education", "counseling"], orgIdx: 3 },

  // Field workers
  { name: "Farah Khan", email: "farah@medrelief.org", role: "field_worker", language: "hi", skills: ["first_aid", "data_collection"], orgIdx: 0 },
  { name: "Deepak Yadav", email: "deepak@annapurna.org", role: "field_worker", language: "mr", skills: ["logistics", "community_outreach"], orgIdx: 1 },
  { name: "Meera Nair", email: "meera@bdrn.org", role: "field_worker", language: "ml", skills: ["search_rescue", "first_aid"], orgIdx: 2 },

  // Volunteers
  { name: "Dr. Anita Kulkarni", email: "anita.vol@gmail.com", role: "volunteer", language: "hi", skills: ["medical", "first_aid", "triage"], orgIdx: 0 },
  { name: "Rahul Mehta", email: "rahul.vol@gmail.com", role: "volunteer", language: "en", skills: ["logistics", "driving", "heavy_lifting"], orgIdx: 1 },
  { name: "Sania Sheikh", email: "sania.vol@gmail.com", role: "volunteer", language: "ur", skills: ["counseling", "translation", "community_outreach"], orgIdx: 2 },
  { name: "Vikram Singh", email: "vikram.vol@gmail.com", role: "volunteer", language: "hi", skills: ["construction", "electrical", "plumbing"], orgIdx: 2 },
  { name: "Pooja Thakur", email: "pooja.vol@gmail.com", role: "volunteer", language: "mr", skills: ["teaching", "childcare", "first_aid"], orgIdx: 3 },
  { name: "Arjun Reddy", email: "arjun.vol@gmail.com", role: "volunteer", language: "te", skills: ["medical", "pharmacy", "data_entry"], orgIdx: 0 },
  { name: "Kavita Ghosh", email: "kavita.vol@gmail.com", role: "volunteer", language: "bn", skills: ["food_preparation", "hygiene", "community_outreach"], orgIdx: 1 },
  { name: "Mohammed Ali", email: "ali.vol@gmail.com", role: "volunteer", language: "ur", skills: ["driving", "logistics", "first_aid"], orgIdx: 2 },
  { name: "Sneha Iyer", email: "sneha.vol@gmail.com", role: "volunteer", language: "ta", skills: ["nursing", "elderly_care", "medical"], orgIdx: 0 },
  { name: "Rajesh Kumar", email: "rajesh.vol@gmail.com", role: "volunteer", language: "hi", skills: ["construction", "carpentry", "heavy_lifting"], orgIdx: 2 },
  { name: "Nisha Fernandez", email: "nisha.vol@gmail.com", role: "volunteer", language: "en", skills: ["teaching", "counseling", "translation"], orgIdx: 3 },
  { name: "Karan Bhatia", email: "karan.vol@gmail.com", role: "volunteer", language: "hi", skills: ["logistics", "food_distribution", "driving"], orgIdx: 1 },
];

// ============================================================
// CASES (diverse needs, statuses, locations across Bengaluru)
// ============================================================
const caseTemplates = [
  // NEW cases (awaiting triage)
  { title: "Elderly woman needs insulin supply", description: "72-year-old diabetic woman in Shivajinagar has run out of insulin. Lives alone, mobility limited. Neighbor reported via helpline.", location_label: "Shivajinagar, Bengaluru", needs: [{ type: "medical", detail: "insulin supply" }], person_info: { name: "Lakshmi Devi", age: 72, gender: "female", family_size: 1, vulnerabilities: ["elderly", "chronic_illness", "mobility_limited"] }, status: "new", language: "hi", orgIdx: 0, lat: 12.9841, lng: 77.6053 },
  { title: "Family displaced by flooding in Koramangala", description: "Family of 6 displaced from ground floor apartment due to monsoon flooding. Need temporary shelter, food, and dry clothes.", location_label: "Koramangala, Bengaluru", needs: [{ type: "shelter", detail: "temporary housing" }, { type: "food", detail: "meals for 6" }, { type: "supplies", detail: "dry clothing" }], person_info: { name: "Irfan Qureshi", age: 38, gender: "male", family_size: 6, vulnerabilities: ["children_under_5", "displaced"] }, status: "new", language: "ur", orgIdx: 2, lat: 12.9352, lng: 77.6245 },
  { title: "Child not attending school for 3 weeks", description: "10-year-old boy stopped attending school. Parents are daily wage workers, child may be working at a local shop.", location_label: "Indiranagar, Bengaluru", needs: [{ type: "education", detail: "school re-enrollment" }, { type: "counseling", detail: "family counseling" }], person_info: { name: "Arjun Kamble", age: 10, gender: "male", family_size: 5, vulnerabilities: ["child", "child_labor_risk"] }, status: "new", language: "mr", orgIdx: 3, lat: 12.9719, lng: 77.6412 },
  { title: "Pregnant woman without prenatal care", description: "7-month pregnant woman in Electronic City has not received any prenatal checkups. Low income, no health insurance.", location_label: "Electronic City, Bengaluru", needs: [{ type: "medical", detail: "prenatal care" }, { type: "transport", detail: "to hospital" }], person_info: { name: "Rekha Waghmare", age: 24, gender: "female", family_size: 3, vulnerabilities: ["pregnant", "low_income"] }, status: "new", language: "mr", orgIdx: 0, lat: 12.8456, lng: 77.6603 },
  { title: "Water contamination in community well", description: "Residents of a Yeshwanthpur slum colony report brown/foul-smelling water from community well. 15+ families affected.", location_label: "Yeshwanthpur, Bengaluru", needs: [{ type: "water", detail: "safe drinking water" }, { type: "health", detail: "water quality testing" }], person_info: { name: "Community Report", family_size: 60, vulnerabilities: ["community_wide", "children"] }, status: "new", language: "hi", orgIdx: 2, lat: 13.0280, lng: 77.5400 },

  // TRIAGED cases (scored by AI, awaiting match)
  { title: "Burn victim needs wound care supplies", description: "35-year-old man suffered cooking gas burn on arms. Treated at hospital, discharged, needs daily wound dressing.", location_label: "Whitefield, Bengaluru", needs: [{ type: "medical", detail: "wound care supplies and training" }], person_info: { name: "Suresh Patil", age: 35, gender: "male", family_size: 2, vulnerabilities: ["injury", "low_income"] }, status: "triaged", language: "hi", orgIdx: 0, lat: 12.9698, lng: 77.7500, severity: 7, vulnerability: 5, confidence: 0.88 },
  { title: "Single mother needs food rations", description: "Single mother of 3 lost domestic work job. No income for 2 weeks. Children showing signs of malnutrition.", location_label: "HSR Layout, Bengaluru", needs: [{ type: "food", detail: "monthly ration kit" }, { type: "livelihood", detail: "job referral" }], person_info: { name: "Geeta Sawant", age: 29, gender: "female", family_size: 4, vulnerabilities: ["single_parent", "children_malnourished", "unemployed"] }, status: "triaged", language: "mr", orgIdx: 1, lat: 12.9082, lng: 77.6476, severity: 8, vulnerability: 9, confidence: 0.92 },
  { title: "Roof collapse risk in monsoon-damaged house", description: "Cracks in load-bearing wall after heavy rains. Family of 4 still living inside. Structural assessment needed.", location_label: "Marathahalli, Bengaluru", needs: [{ type: "shelter", detail: "structural assessment" }, { type: "shelter", detail: "temporary relocation" }], person_info: { name: "Prakash Bhosle", age: 45, gender: "male", family_size: 4, vulnerabilities: ["structural_risk", "elderly_parent"] }, status: "triaged", language: "mr", orgIdx: 2, lat: 12.9569, lng: 77.7011, severity: 9, vulnerability: 7, confidence: 0.75 },

  // ASSIGNED cases (volunteer matched)
  { title: "Wheelchair-bound man needs physiotherapy", description: "Post-accident paraplegic, 28 years old. Needs weekly physiotherapy sessions at home.", location_label: "Yelahanka, Bengaluru", needs: [{ type: "medical", detail: "home physiotherapy" }], person_info: { name: "Nikhil Jadhav", age: 28, gender: "male", family_size: 3, vulnerabilities: ["disability", "mobility_limited"] }, status: "assigned", language: "hi", orgIdx: 0, lat: 13.1007, lng: 77.5963, severity: 6, vulnerability: 8, confidence: 0.95 },
  { title: "Migrant workers need ration cards assistance", description: "Group of 8 interstate migrant workers unable to access PDS rations without local documentation.", location_label: "Hoskote, Bengaluru Metro", needs: [{ type: "documentation", detail: "ration card application" }, { type: "food", detail: "interim food supply" }], person_info: { name: "Group - Bihar Migrants", family_size: 8, vulnerabilities: ["migrant", "undocumented", "food_insecure"] }, status: "assigned", language: "hi", orgIdx: 1, lat: 13.0707, lng: 77.7984, severity: 7, vulnerability: 8, confidence: 0.82 },

  // IN-PROGRESS cases
  { title: "Flood-damaged community toilet restoration", description: "Community toilet block serving 200+ people damaged in flooding. Volunteer construction team dispatched.", location_label: "Bommanahalli, Bengaluru", needs: [{ type: "sanitation", detail: "toilet repair" }, { type: "supplies", detail: "construction materials" }], person_info: { name: "Ward Committee Report", family_size: 200, vulnerabilities: ["community_wide", "sanitation_crisis"] }, status: "in_progress", language: "hi", orgIdx: 2, lat: 12.8995, lng: 77.6220, severity: 8, vulnerability: 7, confidence: 0.90 },

  // COMPLETED cases (awaiting verification)
  { title: "Medicine delivery to bedridden patient", description: "Monthly medicine delivery for 80-year-old bedridden patient completed. Volunteer confirmed delivery.", location_label: "Malleshwaram, Bengaluru", needs: [{ type: "medical", detail: "monthly medicines" }], person_info: { name: "Ramesh Naik", age: 80, gender: "male", family_size: 2, vulnerabilities: ["elderly", "bedridden"] }, status: "completed", language: "mr", orgIdx: 0, lat: 13.0060, lng: 77.5700, severity: 6, vulnerability: 9, confidence: 0.97 },
  { title: "School supplies distributed to 12 children", description: "Notebooks, pens, and bags distributed to children in Shivajinagar community center.", location_label: "Shivajinagar, Bengaluru", needs: [{ type: "education", detail: "school supplies" }], person_info: { name: "Shivajinagar Community Center", family_size: 12, vulnerabilities: ["children", "low_income"] }, status: "completed", language: "hi", orgIdx: 3, lat: 12.9841, lng: 77.6053, severity: 4, vulnerability: 6, confidence: 0.99 },

  // CLOSED cases (fully verified)
  { title: "Emergency food kit to flood-affected family", description: "15-day emergency food kit delivered and confirmed received by family of 5.", location_label: "Jayanagar, Bengaluru", needs: [{ type: "food", detail: "emergency ration" }], person_info: { name: "Yasmin Shaikh", age: 42, gender: "female", family_size: 5, vulnerabilities: ["displaced", "flood_affected"] }, status: "closed", language: "ur", orgIdx: 1, lat: 12.9250, lng: 77.5938, severity: 7, vulnerability: 7, confidence: 0.94 },
  { title: "Temporary shelter provided for 2 weeks", description: "Family relocated to community hall during monsoon. Returned home after structural repair.", location_label: "KR Puram, Bengaluru", needs: [{ type: "shelter", detail: "temporary housing" }], person_info: { name: "Dinesh More", age: 55, gender: "male", family_size: 3, vulnerabilities: ["elderly", "structural_damage"] }, status: "closed", language: "mr", orgIdx: 2, lat: 13.0055, lng: 77.7000, severity: 8, vulnerability: 6, confidence: 0.88 },
];

// ============================================================
// SEED EXECUTION
// ============================================================

async function seed() {
  console.log("Seeding database...\n");

  // 1. Insert organizations
  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .insert(organizations)
    .select();
  if (orgErr) throw new Error(`Organizations: ${orgErr.message}`);
  console.log(`  ✓ ${orgs.length} organizations`);

  // 2. Insert users with locations
  const staffingOptions: Array<"available" | "on_shift" | "delayed" | "committed" | "unavailable"> = ["available", "available", "available", "on_shift", "on_shift", "delayed", "committed", "unavailable"];
  const actionOptions: Array<"idle" | "responding" | "on_scene" | "returning"> = ["idle", "idle", "idle", "idle", "responding", "on_scene", "returning"];

  const userInserts = users.map((u) => ({
    name: u.name,
    email: u.email,
    role: u.role,
    language: u.language,
    skills: u.skills,
    org_id: orgs[u.orgIdx].id,
    location: `SRID=4326;POINT(${jitter(BENGALURU.lng, 0.15)} ${jitter(BENGALURU.lat, 0.15)})`,
    availability: { available: true, hours_per_week: u.role === "volunteer" ? 10 + Math.floor(Math.random() * 20) : 40 },
    staffing: u.role === "volunteer" ? staffingOptions[Math.floor(Math.random() * staffingOptions.length)] : "available",
    action: u.role === "volunteer" ? actionOptions[Math.floor(Math.random() * actionOptions.length)] : "idle",
  }));
  const { data: insertedUsers, error: userErr } = await supabase
    .from("users")
    .insert(userInserts)
    .select();
  if (userErr) throw new Error(`Users: ${userErr.message}`);
  console.log(`  ✓ ${insertedUsers.length} users (${users.filter((u) => u.role === "volunteer").length} volunteers)`);

  // Helper: get user IDs by role
  const volunteers = insertedUsers.filter((u) => u.role === "volunteer");
  const fieldWorkers = insertedUsers.filter((u) => u.role === "field_worker");

  // 3. Insert cases
  const caseInserts = caseTemplates.map((c) => ({
    org_id: orgs[c.orgIdx].id,
    source_channel: "form" as const,
    title: c.title,
    description: c.description,
    location: `SRID=4326;POINT(${c.lng} ${c.lat})`,
    location_label: c.location_label,
    needs: c.needs,
    person_info: c.person_info,
    status: c.status,
    language: c.language,
    created_by: fieldWorkers[Math.floor(Math.random() * fieldWorkers.length)].id,
  }));
  const { data: insertedCases, error: caseErr } = await supabase
    .from("cases")
    .insert(caseInserts)
    .select();
  if (caseErr) throw new Error(`Cases: ${caseErr.message}`);
  console.log(`  ✓ ${insertedCases.length} cases`);

  // 4. Insert assessments for triaged+ cases
  const assessedCases = caseTemplates
    .map((c, i) => ({ ...c, dbId: insertedCases[i].id }))
    .filter((c) => c.severity !== undefined);

  const assessmentInserts = assessedCases.map((c) => ({
    case_id: c.dbId,
    severity: c.severity!,
    vulnerability: c.vulnerability!,
    confidence: c.confidence!,
    freshness: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
    rationale: generateRationale(c),
    is_flagged: c.confidence! < 0.8 || c.severity! >= 9,
    flagged_reason:
      c.confidence! < 0.8
        ? "Low confidence score — recommend field verification"
        : c.severity! >= 9
          ? "Critical severity — requires coordinator review"
          : null,
  }));
  const { data: insertedAssessments, error: assessErr } = await supabase
    .from("assessments")
    .insert(assessmentInserts)
    .select();
  if (assessErr) throw new Error(`Assessments: ${assessErr.message}`);
  console.log(`  ✓ ${insertedAssessments.length} assessments`);

  // 5. Insert assignments for assigned+ cases
  const assignedCaseStatuses = ["assigned", "in_progress", "completed", "closed"];
  const assignedCases = caseTemplates
    .map((c, i) => ({ ...c, dbId: insertedCases[i].id }))
    .filter((c) => assignedCaseStatuses.includes(c.status));

  const assignmentInserts = assignedCases.map((c, i) => {
    const vol = volunteers[i % volunteers.length];
    const aStatus =
      c.status === "assigned" ? "assigned" :
      c.status === "in_progress" ? "in_progress" :
      "completed";
    return {
      case_id: c.dbId,
      volunteer_id: vol.id,
      status: aStatus,
      match_rationale: `Matched based on skills (${vol.skills?.join(", ")}), language, and proximity.`,
      match_score: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
      sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      accepted_at: aStatus !== "assigned" ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : null,
      completed_at: aStatus === "completed" ? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() : null,
    };
  });
  const { data: insertedAssignments, error: assignErr } = await supabase
    .from("assignments")
    .insert(assignmentInserts)
    .select();
  if (assignErr) throw new Error(`Assignments: ${assignErr.message}`);
  console.log(`  ✓ ${insertedAssignments.length} assignments`);

  // 6. Insert verifications for completed/closed cases
  const completedAssignments = insertedAssignments.filter(
    (a) => a.status === "completed"
  );
  if (completedAssignments.length > 0) {
    const coordinators = insertedUsers.filter((u) => u.role === "coordinator");
    const verificationInserts = completedAssignments.map((a) => ({
      assignment_id: a.id,
      proof_notes: "Delivery confirmed by beneficiary. Photo documentation attached.",
      outcome: "confirmed" as const,
      verified_by: coordinators[Math.floor(Math.random() * coordinators.length)].id,
    }));
    const { error: verErr } = await supabase
      .from("verifications")
      .insert(verificationInserts);
    if (verErr) throw new Error(`Verifications: ${verErr.message}`);
    console.log(`  ✓ ${verificationInserts.length} verifications`);
  }

  // 7. Insert audit events for all cases
  const auditInserts = insertedCases.flatMap((c) => {
    const events = [
      { entity_type: "case", entity_id: c.id, action: "created", metadata: { source: "seed" } },
    ];
    if (c.status !== "new") {
      events.push({ entity_type: "case", entity_id: c.id, action: "assessed", metadata: { source: "seed" } });
    }
    if (assignedCaseStatuses.includes(c.status as string)) {
      events.push({ entity_type: "case", entity_id: c.id, action: "assigned", metadata: { source: "seed" } });
    }
    if (c.status === "completed" || c.status === "closed") {
      events.push({ entity_type: "case", entity_id: c.id, action: "completed", metadata: { source: "seed" } });
    }
    if (c.status === "closed") {
      events.push({ entity_type: "case", entity_id: c.id, action: "closed", metadata: { source: "seed" } });
    }
    return events;
  });
  const { error: auditErr } = await supabase
    .from("audit_events")
    .insert(auditInserts);
  if (auditErr) throw new Error(`Audit events: ${auditErr.message}`);
  console.log(`  ✓ ${auditInserts.length} audit events`);

  // 8. Seed dispatch rules
  const dispatchRules = [
    { name: "Critical", condition_min_severity: 9, condition_max_severity: 10, sla_hours: 12, auto_escalate: true },
    { name: "High", condition_min_severity: 7, condition_max_severity: 8, sla_hours: 24, auto_escalate: false },
    { name: "Medium", condition_min_severity: 4, condition_max_severity: 6, sla_hours: 48, auto_escalate: false },
    { name: "Low", condition_min_severity: 1, condition_max_severity: 3, sla_hours: 72, auto_escalate: false },
  ];
  const { error: ruleErr } = await supabase.from("dispatch_rules").insert(dispatchRules);
  if (ruleErr) throw new Error(`Dispatch rules: ${ruleErr.message}`);
  console.log(`  ✓ ${dispatchRules.length} dispatch rules`);

  console.log("\nSeed complete!");
}

function generateRationale(c: (typeof caseTemplates)[0] & { dbId: string }): string {
  const parts: string[] = [];
  if (c.severity! >= 8) parts.push("High severity: immediate intervention needed");
  else if (c.severity! >= 5) parts.push("Moderate severity: timely response recommended");
  else parts.push("Lower severity: can be scheduled in standard queue");

  const vulns = c.person_info.vulnerabilities || [];
  if (vulns.length > 0) parts.push(`Vulnerability factors: ${vulns.join(", ")}`);
  if (c.person_info.age && c.person_info.age > 65) parts.push("Elderly individual — elevated priority");
  if (c.person_info.age && c.person_info.age < 12) parts.push("Minor involved — child protection protocols apply");
  if ((c.person_info.family_size || 1) > 4) parts.push(`Large household (${c.person_info.family_size} members) amplifies impact`);
  if (c.confidence! < 0.8) parts.push("Note: confidence below threshold — field verification recommended");

  return parts.join(". ") + ".";
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
