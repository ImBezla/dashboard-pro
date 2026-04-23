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

/** Seed-Flows: absichtlich leer — Prozesse legen Nutzer selbst an (Overlay / API). */
const flows: Flow[] = [];
const nodes: FlowNode[] = [];
const edges: FlowEdge[] = [];

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
    entityType: 'project',
    entityId: PID,
    level: 'warning',
    message: 'Meilenstein „Flow-Review“ ohne verantwortliche Rolle.',
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

/** Leerer Flow-Seed (Kopie pro Aufruf — Merge mit Nutzer-Overlay / Server-Workspace). */
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
