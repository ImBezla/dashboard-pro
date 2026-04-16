export type ProjectStatus =
  | 'idea'
  | 'planning'
  | 'active'
  | 'blocked'
  | 'review'
  | 'completed'
  | 'archived';

export type FlowNodeType =
  | 'trigger'
  | 'input'
  | 'decision'
  | 'action'
  | 'delay'
  | 'review'
  | 'approval'
  | 'publish'
  | 'notify'
  | 'document'
  | 'manual'
  | 'ai'
  | 'external';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  owner?: string;
  tags?: string[];
  goal?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | 'brief'
  | 'sop'
  | 'research'
  | 'proposal'
  | 'checklist'
  | 'meeting-notes'
  | 'spec';

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  type: DocumentType;
  content?: string;
  author?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Kontext für operative Prozessplanung (Onboarding, Abwicklung, …). */
export type OperationalDomain =
  | 'healthcare'
  | 'customer_success'
  | 'internal'
  | 'generic';

export interface Flow {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  /** z. B. Patientenpfad vs. allgemeines Kunden-Onboarding */
  domain?: OperationalDomain;
  /** Ein Satz: Welches Ergebnis soll der Prozess liefern? */
  goal?: string;
  /** Grobe Phasen nur zur Orientierung beim Planen (kein Laufzeit-Engine). */
  phases?: string[];
  /** Freie Schlagwörter (Compliance, KPI, …). */
  tags?: string[];
}

export type FlowNodeRunStatus = 'idle' | 'active' | 'done' | 'failed' | 'blocked';

export interface FlowNode {
  id: string;
  projectId: string;
  flowId: string;
  type: FlowNodeType;
  title: string;
  description?: string;
  status?: FlowNodeRunStatus;
  position: { x: number; y: number };
  inputs?: string[];
  outputs?: string[];
  owner?: string;
  linkedDocumentIds?: string[];
}

export interface FlowEdge {
  id: string;
  flowId: string;
  source: string;
  target: string;
  label?: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  owner?: string;
  dueAt?: string;
  linkedNodeId?: string;
  linkedDocumentIds?: string[];
}

export type LogEntityType = 'project' | 'flow' | 'node' | 'document' | 'task' | 'system';
export type LogLevel = 'info' | 'warning' | 'error';

export interface ActivityLog {
  id: string;
  entityType: LogEntityType;
  entityId: string;
  level: LogLevel;
  message: string;
  timestamp: string;
}

/** Planning canvas (mock). */
export interface ProjectNote {
  id: string;
  projectId: string;
  title: string;
  body: string;
  cluster: string;
  x: number;
  y: number;
  linkedNoteIds: string[];
}

export interface ProjectResource {
  id: string;
  projectId: string;
  title: string;
  href: string;
  kind: 'link' | 'tool' | 'asset' | 'reference';
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  at: string;
  kind: 'launch' | 'review' | 'doc' | 'task' | 'flow';
}

export interface PublishingItem {
  id: string;
  projectId: string;
  title: string;
  channel: string;
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
}

export interface AutomationJob {
  id: string;
  projectId: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'paused';
  lastRunAt?: string;
}

export interface ModerationItem {
  id: string;
  projectId: string;
  summary: string;
  status: 'open' | 'escalated' | 'resolved';
  createdAt: string;
}
