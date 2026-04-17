import type {
  ActivityLog,
  AutomationJob,
  Flow,
  FlowEdge,
  FlowNode,
  ModerationItem,
  Milestone,
  Project,
  ProjectDocument,
  ProjectNote,
  ProjectResource,
  ProjectTask,
  PublishingItem,
} from '@/lib/operations-os/types';

function iso(minOffset: number) {
  return new Date(Date.now() - minOffset * 60_000).toISOString();
}

export const OPS_PROJECT_ID = 'oos-prj-1';
const PID = OPS_PROJECT_ID;

/** Drei Beispiel-Abläufe zur **operativen Planung** (noch Mock, später API/DB). */
const flows: Flow[] = [
  {
    id: 'oos-flw-patient',
    projectId: PID,
    title: 'Patienten-Onboarding (Praxis)',
    description:
      'Von Erstkontakt bis „bereit für Behandlung“ – inkl. Einwilligungen, Versicherung, Termin, Anamnese.',
    domain: 'healthcare',
    goal:
      'Patient:in rechtssicher, informiert und administrativ vollständig in die Behandlung führen – ohne Medienbrüche.',
    phases: ['Zugang', 'Compliance', 'Abrechnung', 'Termin & Vorbereitung', 'Abschluss'],
    tags: ['DSGVO', 'GoBD', 'Termin', 'Anamnese'],
    createdAt: iso(200),
    updatedAt: iso(20),
  },
  {
    id: 'oos-flw-b2b',
    projectId: PID,
    title: 'B2B-Kunden-Onboarding (SaaS)',
    description:
      'Rollen, Datenimport, Schulung, Go-Live – typisch für neue Organisationen in eurer Plattform.',
    domain: 'customer_success',
    goal:
      'Neukunde produktiv und zufrieden innerhalb des vereinbarten Zeitfensters – mit messbaren Meilensteinen.',
    phases: ['Kickoff', 'Technik', 'Enablement', 'Go-Live', 'Hypercare'],
    tags: ['CSM', 'SLA', 'Training', 'Import'],
    createdAt: iso(400),
    updatedAt: iso(40),
  },
  {
    id: 'oos-flw-intern',
    projectId: PID,
    title: 'Intern: Übergabe Ops → Support',
    description: 'Kurzer Standard für Eskalationen und Wissensweitergabe.',
    domain: 'internal',
    goal: 'Tickets und Kontext sauber übergeben, Doppelarbeit vermeiden.',
    phases: ['Triage', 'Übergabe', 'Abschluss'],
    tags: ['Handover', 'Runbook'],
    createdAt: iso(600),
    updatedAt: iso(60),
  },
];

const nodes: FlowNode[] = [
  /* ——— Patienten-Onboarding ——— */
  {
    id: 'pat-1',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'trigger',
    title: 'Erstkontakt (Portal / Anruf)',
    description: 'Erste Registrierung oder Aufnahme ins System',
    status: 'idle',
    position: { x: 40, y: 80 },
  },
  {
    id: 'pat-2',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'input',
    title: 'Stammdaten & Notfallkontakt',
    status: 'idle',
    position: { x: 260, y: 80 },
  },
  {
    id: 'pat-3',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'document',
    title: 'Einwilligungen & Vorbefunde',
    description: 'Behandlung, Datenschutz, ggf. Fernbehandlung',
    status: 'idle',
    position: { x: 480, y: 80 },
  },
  {
    id: 'pat-4',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'decision',
    title: 'Versicherungsnachweis vollständig?',
    status: 'idle',
    position: { x: 700, y: 80 },
  },
  {
    id: 'pat-5a',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'action',
    title: 'Selbstzahler / Kostenvoranschlag',
    status: 'idle',
    position: { x: 920, y: 20 },
  },
  {
    id: 'pat-5b',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'external',
    title: 'Kostenträger (GKV/PKV) prüfen',
    status: 'idle',
    position: { x: 920, y: 140 },
  },
  {
    id: 'pat-6',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'review',
    title: 'Fallakte Plausibilität (Pflege/Arzt)',
    status: 'idle',
    position: { x: 1140, y: 80 },
  },
  {
    id: 'pat-7',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'notify',
    title: 'Termin + Vorbereitung (SMS/Mail)',
    status: 'idle',
    position: { x: 1360, y: 80 },
  },
  {
    id: 'pat-8',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'manual',
    title: 'Anamnese vor Ort / Telemedizin',
    status: 'idle',
    position: { x: 1580, y: 80 },
  },
  {
    id: 'pat-9',
    projectId: PID,
    flowId: 'oos-flw-patient',
    type: 'publish',
    title: 'Status: bereit für Behandlung',
    status: 'idle',
    position: { x: 1800, y: 80 },
  },
  /* ——— B2B-Onboarding ——— */
  {
    id: 'b2b-1',
    projectId: PID,
    flowId: 'oos-flw-b2b',
    type: 'trigger',
    title: 'Vertrag / Bestellung',
    status: 'idle',
    position: { x: 40, y: 100 },
  },
  {
    id: 'b2b-2',
    projectId: PID,
    flowId: 'oos-flw-b2b',
    type: 'action',
    title: 'Mandant anlegen & Rollen',
    status: 'idle',
    position: { x: 260, y: 100 },
  },
  {
    id: 'b2b-3',
    projectId: PID,
    flowId: 'oos-flw-b2b',
    type: 'input',
    title: 'Datenimport / Integration',
    status: 'idle',
    position: { x: 480, y: 100 },
  },
  {
    id: 'b2b-4',
    projectId: PID,
    flowId: 'oos-flw-b2b',
    type: 'approval',
    title: 'Sicherheits-Check (Zugriffe)',
    status: 'idle',
    position: { x: 700, y: 100 },
  },
  {
    id: 'b2b-5',
    projectId: PID,
    flowId: 'oos-flw-b2b',
    type: 'manual',
    title: 'Schulung Key User',
    status: 'idle',
    position: { x: 920, y: 100 },
  },
  {
    id: 'b2b-6',
    projectId: PID,
    flowId: 'oos-flw-b2b',
    type: 'decision',
    title: 'Go-Live-Kriterien erfüllt?',
    status: 'idle',
    position: { x: 1140, y: 100 },
  },
  {
    id: 'b2b-7',
    projectId: PID,
    flowId: 'oos-flw-b2b',
    type: 'publish',
    title: 'Produktivschaltung + Hypercare-Start',
    status: 'idle',
    position: { x: 1360, y: 100 },
  },
  /* ——— Intern ——— */
  {
    id: 'int-1',
    projectId: PID,
    flowId: 'oos-flw-intern',
    type: 'trigger',
    title: 'Eskalation / Ticket',
    status: 'idle',
    position: { x: 80, y: 120 },
  },
  {
    id: 'int-2',
    projectId: PID,
    flowId: 'oos-flw-intern',
    type: 'document',
    title: 'Runbook & Kontext sammeln',
    status: 'idle',
    position: { x: 320, y: 120 },
  },
  {
    id: 'int-3',
    projectId: PID,
    flowId: 'oos-flw-intern',
    type: 'notify',
    title: 'Übergabe & Abschluss-Post',
    status: 'idle',
    position: { x: 560, y: 120 },
  },
];

const edges: FlowEdge[] = [
  { id: 'e-pat-1', flowId: 'oos-flw-patient', source: 'pat-1', target: 'pat-2' },
  { id: 'e-pat-2', flowId: 'oos-flw-patient', source: 'pat-2', target: 'pat-3' },
  { id: 'e-pat-3', flowId: 'oos-flw-patient', source: 'pat-3', target: 'pat-4' },
  { id: 'e-pat-4a', flowId: 'oos-flw-patient', source: 'pat-4', target: 'pat-5a', label: 'nein' },
  { id: 'e-pat-4b', flowId: 'oos-flw-patient', source: 'pat-4', target: 'pat-5b', label: 'ja' },
  { id: 'e-pat-5a', flowId: 'oos-flw-patient', source: 'pat-5a', target: 'pat-6' },
  { id: 'e-pat-5b', flowId: 'oos-flw-patient', source: 'pat-5b', target: 'pat-6' },
  { id: 'e-pat-6', flowId: 'oos-flw-patient', source: 'pat-6', target: 'pat-7' },
  { id: 'e-pat-7', flowId: 'oos-flw-patient', source: 'pat-7', target: 'pat-8' },
  { id: 'e-pat-8', flowId: 'oos-flw-patient', source: 'pat-8', target: 'pat-9' },
  { id: 'e-b2b-1', flowId: 'oos-flw-b2b', source: 'b2b-1', target: 'b2b-2' },
  { id: 'e-b2b-2', flowId: 'oos-flw-b2b', source: 'b2b-2', target: 'b2b-3' },
  { id: 'e-b2b-3', flowId: 'oos-flw-b2b', source: 'b2b-3', target: 'b2b-4' },
  { id: 'e-b2b-4', flowId: 'oos-flw-b2b', source: 'b2b-4', target: 'b2b-5' },
  { id: 'e-b2b-5', flowId: 'oos-flw-b2b', source: 'b2b-5', target: 'b2b-6' },
  { id: 'e-b2b-6y', flowId: 'oos-flw-b2b', source: 'b2b-6', target: 'b2b-7', label: 'ja' },
  { id: 'e-b2b-6n', flowId: 'oos-flw-b2b', source: 'b2b-6', target: 'b2b-5', label: 'nein' },
  { id: 'e-int-1', flowId: 'oos-flw-intern', source: 'int-1', target: 'int-2' },
  { id: 'e-int-2', flowId: 'oos-flw-intern', source: 'int-2', target: 'int-3' },
];

export type OpsOsStore = {
  flows: Flow[];
  nodes: FlowNode[];
  edges: FlowEdge[];
};

/** Erweiterter Mock inkl. Projekte, Tasks, Dokumente, … (Operations-OS UI). */
export type OpsOsWorkspaceData = OpsOsStore & {
  projects: Project[];
  tasks: ProjectTask[];
  documents: ProjectDocument[];
  logs: ActivityLog[];
  milestones: Milestone[];
  resources: ProjectResource[];
  publishing: PublishingItem[];
  automations: AutomationJob[];
  moderation: ModerationItem[];
  notes: ProjectNote[];
};

const mockProjects: Project[] = [
  {
    id: PID,
    title: 'Pilot: Operations OS',
    description: 'End-to-end Mock für Flows, Tasks, Dokumente und Logs.',
    status: 'active',
    priority: 'high',
    owner: 'Ops',
    goal: 'Betriebs-Transparenz und schnelle Übergaben zwischen Teams.',
    deadline: iso(60 * 24 * 14),
    createdAt: iso(8000),
    updatedAt: iso(10),
  },
  {
    id: 'oos-prj-2',
    title: 'Intern: Tooling-Roadmap',
    description: 'Kleinere Initiative für Analytics und Automationen.',
    status: 'planning',
    priority: 'medium',
    owner: 'Platform',
    createdAt: iso(9000),
    updatedAt: iso(120),
  },
];

const mockTasks: ProjectTask[] = [
  {
    id: 'oos-t-1',
    projectId: PID,
    title: 'Flow-Review Patienten-Onboarding',
    status: 'in-progress',
    priority: 'high',
    owner: 'Ops',
    dueAt: iso(60 * 24 * 2),
  },
  {
    id: 'oos-t-2',
    projectId: PID,
    title: 'Dokumentenvorlagen harmonisieren',
    status: 'todo',
    priority: 'medium',
    dueAt: iso(60 * 24 * 5),
  },
  {
    id: 'oos-t-3',
    projectId: PID,
    title: 'Moderations-Playbook finalisieren',
    status: 'blocked',
    priority: 'critical',
  },
  {
    id: 'oos-t-4',
    projectId: PID,
    title: 'Wöchentlicher KPI-Export',
    status: 'done',
    priority: 'low',
  },
  {
    id: 'oos-t-5',
    projectId: 'oos-prj-2',
    title: 'CI-Job für Deploy-Bundle',
    status: 'review',
    priority: 'medium',
  },
];

const mockDocuments: ProjectDocument[] = [
  {
    id: 'oos-d-1',
    projectId: PID,
    title: 'SOP: Patienten-Onboarding',
    type: 'sop',
    author: 'Ops',
    createdAt: iso(3000),
    updatedAt: iso(50),
  },
  {
    id: 'oos-d-2',
    projectId: PID,
    title: 'Research: Versicherungsnachweise',
    type: 'research',
    createdAt: iso(4000),
    updatedAt: iso(80),
  },
  {
    id: 'oos-d-3',
    projectId: 'oos-prj-2',
    title: 'Checkliste VPS-Go-Live',
    type: 'checklist',
    createdAt: iso(5000),
    updatedAt: iso(200),
  },
];

const mockLogs: ActivityLog[] = [
  {
    id: 'oos-l-1',
    entityType: 'project',
    entityId: PID,
    level: 'info',
    message: 'Projekt aktualisiert — Zieltext verfeinert.',
    timestamp: iso(30),
  },
  {
    id: 'oos-l-2',
    entityType: 'flow',
    entityId: 'oos-flw-patient',
    level: 'warning',
    message: 'Knoten „Versicherungsnachweis“ ohne Owner.',
    timestamp: iso(90),
  },
  {
    id: 'oos-l-3',
    entityType: 'task',
    entityId: 'oos-t-3',
    level: 'error',
    message: 'Task blockiert — Freigabe ausstehend.',
    timestamp: iso(120),
  },
];

const mockMilestones: Milestone[] = [
  { id: 'oos-m-1', projectId: PID, title: 'Kickoff abgeschlossen', at: iso(2000), kind: 'launch' },
  { id: 'oos-m-2', projectId: PID, title: 'SOP freigegeben', at: iso(1500), kind: 'doc' },
  { id: 'oos-m-3', projectId: PID, title: 'Flow-Review', at: iso(800), kind: 'flow' },
];

const mockResources: ProjectResource[] = [
  {
    id: 'oos-r-1',
    projectId: PID,
    title: 'Runbook (Notion)',
    href: 'https://example.com/runbook',
    kind: 'link',
  },
  {
    id: 'oos-r-2',
    projectId: PID,
    title: 'Staging-Dashboard',
    href: 'https://example.com/staging',
    kind: 'tool',
  },
];

const mockPublishing: PublishingItem[] = [
  {
    id: 'oos-pb-1',
    projectId: PID,
    title: 'Release Notes v0.9',
    channel: 'web',
    scheduledAt: iso(200),
    status: 'scheduled',
  },
];

const mockAutomations: AutomationJob[] = [
  {
    id: 'oos-au-1',
    projectId: PID,
    name: 'Nightly KPI Digest',
    status: 'idle',
    lastRunAt: iso(60 * 12),
  },
  {
    id: 'oos-au-2',
    projectId: PID,
    name: 'Webhook: CRM Sync',
    status: 'success',
    lastRunAt: iso(60 * 2),
  },
];

const mockModeration: ModerationItem[] = [
  {
    id: 'oos-md-1',
    projectId: PID,
    summary: 'Verdächtiger Upload in Dokumentenbereich',
    status: 'open',
    createdAt: iso(400),
  },
];

const mockNotes: ProjectNote[] = [
  {
    id: 'oos-n-1',
    projectId: PID,
    title: 'Risiko: Versicherung',
    body: 'Edge-Case bei PKV-Wechsel — mit Legal abstimmen.',
    cluster: 'compliance',
    x: 120,
    y: 80,
    linkedNoteIds: [],
  },
];

/** Unveränderliche Demo-Daten (Kopie pro Aufruf — sicher für Merge mit Nutzer-Overlay). */
export function getSeedOpsStore(): OpsOsStore {
  return {
    flows: JSON.parse(JSON.stringify(flows)) as Flow[],
    nodes: JSON.parse(JSON.stringify(nodes)) as FlowNode[],
    edges: JSON.parse(JSON.stringify(edges)) as FlowEdge[],
  };
}

export function getOpsOsStore(): OpsOsWorkspaceData {
  const seed = getSeedOpsStore();
  return {
    flows: seed.flows,
    nodes: seed.nodes,
    edges: seed.edges,
    projects: JSON.parse(JSON.stringify(mockProjects)) as Project[],
    tasks: JSON.parse(JSON.stringify(mockTasks)) as ProjectTask[],
    documents: JSON.parse(JSON.stringify(mockDocuments)) as ProjectDocument[],
    logs: JSON.parse(JSON.stringify(mockLogs)) as ActivityLog[],
    milestones: JSON.parse(JSON.stringify(mockMilestones)) as Milestone[],
    resources: JSON.parse(JSON.stringify(mockResources)) as ProjectResource[],
    publishing: JSON.parse(JSON.stringify(mockPublishing)) as PublishingItem[],
    automations: JSON.parse(JSON.stringify(mockAutomations)) as AutomationJob[],
    moderation: JSON.parse(JSON.stringify(mockModeration)) as ModerationItem[],
    notes: JSON.parse(JSON.stringify(mockNotes)) as ProjectNote[],
  };
}

export function opsProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}

export function opsFlowsForProject(projectId: string): Flow[] {
  return flows.filter((f) => f.projectId === projectId);
}

export function opsNotesForProject(projectId: string): ProjectNote[] {
  return mockNotes.filter((n) => n.projectId === projectId);
}
