export type ProcessStatus =
  | 'draft'
  | 'pending'
  | 'running'
  | 'blocked'
  | 'review'
  | 'done'
  | 'failed';

export type JobStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'success'
  | 'warning'
  | 'failed'
  | 'paused'
  | 'blocked';

export type AccountStatus = 'active' | 'warning' | 'paused' | 'restricted';

export type ContentStage =
  | 'idea'
  | 'generated'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface ProcessItem {
  id: string;
  title: string;
  description?: string;
  status: ProcessStatus;
  priority: Priority;
  owner?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  dueAt?: string;
  nextStep?: string;
  tags?: string[];
  dependencies?: string[];
}

export interface InstaAccount {
  id: string;
  name: string;
  niche: string;
  status: AccountStatus;
  platform: 'instagram';
  lastPostAt?: string;
  followers?: number;
  engagementRate?: number;
  healthScore: number;
}

export type AutomationJobType =
  | 'collector'
  | 'generator'
  | 'scheduler'
  | 'publisher'
  | 'moderation'
  | 'analytics';

export interface AutomationJob {
  id: string;
  name: string;
  type: AutomationJobType;
  status: JobStatus;
  accountId: string;
  lastRunAt?: string;
  nextRunAt?: string;
  successRate?: number;
  errorRate?: number;
  lastError?: string;
}

export type ContentFormat = 'post' | 'reel' | 'story' | 'carousel';

export interface ContentItem {
  id: string;
  accountId: string;
  title: string;
  format: ContentFormat;
  stage: ContentStage;
  scheduledAt?: string;
  publishedAt?: string;
  caption?: string;
  assetUrl?: string;
}

export type ActivityEntityType =
  | 'process'
  | 'account'
  | 'content'
  | 'job'
  | 'system';

export type ActivityLevel = 'info' | 'warning' | 'error';

export interface ActivityLog {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  level: ActivityLevel;
  message: string;
  timestamp: string;
}

export type ModerationType = 'comment' | 'dm';

export type ModerationStatus = 'open' | 'reviewing' | 'resolved' | 'flagged';

export interface ModerationItem {
  id: string;
  accountId: string;
  type: ModerationType;
  content: string;
  status: ModerationStatus;
  author: string;
  createdAt: string;
}

export const CONTENT_STAGES: ContentStage[] = [
  'idea',
  'generated',
  'review',
  'approved',
  'scheduled',
  'published',
  'failed',
];
