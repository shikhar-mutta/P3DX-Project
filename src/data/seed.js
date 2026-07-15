// ---------------------------------------------------------------------------
// Seed data modelling the P3DX cross-border scenario:
// An Indian citizen (Arjun) studied in Bengaluru, works in Berlin.
// His degree lives with the university, health record with a hospital,
// tax identity with the government — each inside its own governed World.
// ---------------------------------------------------------------------------

export const WORLD_TYPES = {
  jurisdiction: { label: 'Jurisdictional World', icon: '🌐' },
  institution: { label: 'Institutional World', icon: '🏛️' },
  department: { label: 'Departmental World', icon: '🗂️' },
};

export const worlds = [
  {
    id: 'w-india',
    name: 'Republic of India',
    type: 'jurisdiction',
    parentId: null,
    law: 'DPDP Act, 2023',
    region: 'in',
    description:
      'Indian jurisdictional World. All data flows in or out are governed by the Digital Personal Data Protection Act and pass through the national Gateway.',
    gateway: { id: 'g-india', name: 'India National Gateway' },
  },
  {
    id: 'w-univ',
    name: 'Bengaluru Institute of Technology',
    type: 'institution',
    parentId: 'w-india',
    law: 'UGC Records Policy',
    region: 'in',
    description:
      'University World holding academic records. Issues and attests degrees, transcripts and enrolment proofs.',
    gateway: { id: 'g-univ', name: 'BIT Institutional Gateway' },
  },
  {
    id: 'w-univ-exams',
    name: 'Examinations & Records Dept.',
    type: 'department',
    parentId: 'w-univ',
    law: 'BIT Examination Bylaws',
    region: 'in',
    description:
      'Departmental World inside the university that maintains the authoritative degree and transcript registry.',
    gateway: { id: 'g-univ-exams', name: 'Records Dept. Gateway' },
  },
  {
    id: 'w-hospital',
    name: 'Nirvaan General Hospital',
    type: 'institution',
    parentId: 'w-india',
    law: 'EHR Standards (MoHFW)',
    region: 'in',
    description:
      'Hospital World bound by Indian medical-privacy regulation. Holds patient health records and diagnostics.',
    gateway: { id: 'g-hospital', name: 'Nirvaan Hospital Gateway' },
  },
  {
    id: 'w-tax',
    name: 'Income Tax Department',
    type: 'institution',
    parentId: 'w-india',
    law: 'Income Tax Act, 1961',
    region: 'in',
    description:
      'Government institutional World holding tax identity (PAN) and income attestations.',
    gateway: { id: 'g-tax', name: 'ITD Gateway' },
  },
  {
    id: 'w-eu',
    name: 'European Union',
    type: 'jurisdiction',
    parentId: null,
    law: 'GDPR',
    region: 'eu',
    description:
      'EU jurisdictional World. Cross-border inbound data must satisfy GDPR lawful-basis and purpose-limitation checks at the Gateway.',
    gateway: { id: 'g-eu', name: 'EU Jurisdictional Gateway' },
  },
  {
    id: 'w-company',
    name: 'Steinmetz Analytics GmbH',
    type: 'institution',
    parentId: 'w-eu',
    law: 'GDPR + BDSG (Germany)',
    region: 'eu',
    description:
      'Berlin-based employer World. Its agents request verified credentials from foreign Worlds through governed connections.',
    gateway: { id: 'g-company', name: 'Steinmetz Corporate Gateway' },
  },
  {
    id: 'w-company-hr',
    name: 'HR & Compliance Dept.',
    type: 'department',
    parentId: 'w-company',
    law: 'Works Council Data Charter',
    region: 'eu',
    description:
      'Departmental World inside Steinmetz responsible for onboarding, credential verification and employee records.',
    gateway: { id: 'g-company-hr', name: 'HR Dept. Gateway' },
  },
  {
    id: 'w-company-eng',
    name: 'Engineering Dept.',
    type: 'department',
    parentId: 'w-company',
    law: 'Internal IP & Access Policy',
    region: 'eu',
    description:
      'Second departmental World inside Steinmetz, holding project and engineering data behind its own Gateway.',
    gateway: { id: 'g-company-eng', name: 'Engineering Dept. Gateway' },
  },
];

export const agents = [
  {
    id: 'a-arjun',
    name: 'Arjun Mehta',
    role: 'Indian Citizen',
    kind: 'human',
    worldId: 'w-india',
    hue: 210,
    bio: 'Data principal. Studied at BIT Bengaluru, now employed in Berlin. Owns the lockers at the centre of this scenario.',
  },
  {
    id: 'a-registrar',
    name: 'Prof. Kavitha Rao',
    role: 'University Registrar',
    kind: 'human',
    worldId: 'w-univ-exams',
    hue: 30,
    bio: 'Custodian of the degree registry. Attests academic records released from the Records Dept. World.',
  },
  {
    id: 'a-hosp-admin',
    name: 'Dr. Sanjay Iyer',
    role: 'Hospital Records Admin',
    kind: 'human',
    worldId: 'w-hospital',
    hue: 0,
    bio: 'Administers the hospital health-record lockers and reviews inbound connection requests.',
  },
  {
    id: 'a-diag-ai',
    name: 'MedAssist Diagnostic AI',
    role: 'AI Agent · Diagnostics',
    kind: 'ai',
    worldId: 'w-hospital',
    hue: 280,
    bio: 'Autonomous diagnostic agent. May request prior records only under scoped, logged, revocable consent.',
  },
  {
    id: 'a-tax-officer',
    name: 'ITD Attestation Service',
    role: 'Government Service',
    kind: 'institution',
    worldId: 'w-tax',
    hue: 140,
    bio: 'Issues signed income and PAN attestations from the Income Tax Department World.',
  },
  {
    id: 'a-anna',
    name: 'Anna Weber',
    role: 'HR Manager',
    kind: 'human',
    worldId: 'w-company-hr',
    hue: 330,
    bio: 'Runs onboarding at Steinmetz Berlin. Needs Arjun’s degree verified for his employment contract.',
  },
  {
    id: 'a-credcheck-ai',
    name: 'CredCheck Verification AI',
    role: 'AI Agent · Credential Verification',
    kind: 'ai',
    worldId: 'w-company-hr',
    hue: 260,
    bio: 'Autonomous verification agent acting on behalf of Steinmetz HR. Every request it makes is purpose-scoped and gateway-mediated.',
  },
  {
    id: 'a-loan-ai',
    name: 'QuickCred Underwriting AI',
    role: 'AI Agent · Loan Underwriting',
    kind: 'ai',
    worldId: 'w-india',
    hue: 45,
    bio: 'Bank-side underwriting agent that requests income proofs — never raw records — under time-boxed consent.',
  },
  {
    id: 'a-lukas',
    name: 'Lukas Braun',
    role: 'Engineering Lead',
    kind: 'human',
    worldId: 'w-company-eng',
    hue: 175,
    bio: 'Leads the Berlin engineering team. His project data lives in the Engineering Dept. World, behind its own Gateway.',
  },
];

export const lockers = [
  {
    id: 'l-academic',
    description: 'Degree, transcripts and enrolment proofs issued by BIT Bengaluru.',
    name: 'Academic Locker',
    ownerId: 'a-arjun',
    worldId: 'w-univ-exams',
    type: 'academic',
    icon: '🎓',
    records: ['B.Tech Degree Certificate', 'Semester Transcripts', 'Enrolment Proof'],
    endpoints: [
      {
        id: 'ep-degree-verify',
        name: 'Degree Verification Endpoint',
        description: 'Returns a signed yes/no attestation of a degree — never the full transcript.',
      },
      {
        id: 'ep-transcript',
        name: 'Transcript Release Endpoint',
        description: 'Releases full transcripts; requires explicit owner consent per request.',
      },
    ],
  },
  {
    id: 'l-health',
    description: 'Medical history and diagnostics held at Nirvaan General Hospital.',
    name: 'Health Locker',
    ownerId: 'a-arjun',
    worldId: 'w-hospital',
    type: 'health',
    icon: '🩺',
    records: ['Medical History', 'Lab Reports 2024–25', 'Vaccination Record'],
    endpoints: [
      {
        id: 'ep-health-summary',
        name: 'Care Summary Endpoint',
        description: 'Shares a treatment-relevant summary with authorised care providers.',
      },
    ],
  },
  {
    id: 'l-identity',
    description: 'PAN identity and income attestations held by the Income Tax Department.',
    name: 'Tax & Identity Locker',
    ownerId: 'a-arjun',
    worldId: 'w-tax',
    type: 'identity',
    icon: '🪪',
    records: ['PAN Identity', 'Income Attestation FY 2025-26', 'Filing History'],
    endpoints: [
      {
        id: 'ep-income-proof',
        name: 'Income Proof Endpoint',
        description: 'Issues a signed income-range attestation without exposing filings.',
      },
    ],
  },
  {
    id: 'l-employment',
    description: 'Employment contract and payroll records at Steinmetz Berlin.',
    name: 'Employment Locker',
    ownerId: 'a-arjun',
    worldId: 'w-company-hr',
    type: 'employment',
    icon: '💼',
    records: ['Employment Contract', 'Payslips', 'Background Check Result'],
    endpoints: [
      {
        id: 'ep-employment-proof',
        name: 'Employment Proof Endpoint',
        description: 'Confirms active employment status to authorised requesters.',
      },
    ],
  },
  {
    id: 'l-registry',
    description: "The university's authoritative ledger of all conferred degrees.",
    name: 'Degree Registry',
    ownerId: 'a-registrar',
    worldId: 'w-univ-exams',
    type: 'academic',
    icon: '📜',
    records: ['Institutional Degree Ledger', 'Convocation Records'],
    endpoints: [
      {
        id: 'ep-registry-attest',
        name: 'Registry Attestation Endpoint',
        description: 'Institution-signed confirmation that a credential exists in the ledger.',
      },
    ],
  },
  {
    id: 'l-projects',
    description: 'Engineering project workspace data, inside the Engineering Dept. World.',
    name: 'Project Workspace Locker',
    ownerId: 'a-lukas',
    worldId: 'w-company-eng',
    type: 'employment',
    icon: '🛠️',
    records: ['Project Delta Specs', 'Code Review Logs'],
    endpoints: [],
  },
];

// One connection is pre-seeded mid-flow so the reviewer immediately sees the
// state machine; the headline scenario (CredCheck → Academic Locker) is left
// for the demo walkthrough to create live.
export const connections = [
  {
    id: 'c-seed-1',
    requesterId: 'a-loan-ai',
    endpointId: 'ep-income-proof',
    lockerId: 'l-identity',
    purpose: 'Loan underwriting — verify declared income range for application #88231.',
    status: 'pending',
    history: [
      { status: 'requested', at: '2026-07-12T09:14:00Z', note: 'Request submitted to ITD Gateway' },
      { status: 'pending', at: '2026-07-12T09:15:00Z', note: 'Cleared ITD Gateway policy screen; awaiting owner approval' },
    ],
  },
];

export const consents = [];

export const transactions = [
  {
    id: 't-seed-1',
    at: '2026-06-30T11:02:00Z',
    fromLockerId: 'l-health',
    requesterId: 'a-diag-ai',
    connectionId: null,
    consentId: null,
    consentLabel: 'Consent #legacy-014 (expired)',
    data: ['Lab Reports 2024–25'],
    gatewayIds: ['g-hospital'],
    purpose: 'Pre-consultation review before cardiology appointment.',
    status: 'completed',
  },
];

export function seedState() {
  return {
    worlds,
    agents,
    lockers,
    connections: JSON.parse(JSON.stringify(connections)),
    consents: JSON.parse(JSON.stringify(consents)),
    transactions: JSON.parse(JSON.stringify(transactions)),
    actingAs: 'a-arjun',
  };
}
