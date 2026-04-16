import { CoContentStageBadge, CoSectionHeader } from '@/components/content-ops/primitives';
import { mockAccounts, mockContent } from '@/lib/content-ops/mock-data';
import { CONTENT_STAGES } from '@/lib/content-ops/types';
import type { ContentItem, ContentStage } from '@/lib/content-ops/types';
import { formatDateTime } from '@/lib/content-ops/format';
import { cn } from '@/lib/content-ops/cn';

function accountName(id: string) {
  return mockAccounts.find((a) => a.id === id)?.name ?? id;
}

function KanbanCard({ item }: { item: ContentItem }) {
  return (
    <div className="rounded-md border border-zinc-700/80 bg-zinc-900/60 p-2.5 shadow-sm">
      <div className="text-xs font-medium text-zinc-100">{item.title}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
          {item.format}
        </span>
        <span className="truncate text-[10px] text-zinc-400">{accountName(item.accountId)}</span>
      </div>
      {item.scheduledAt && (
        <div className="mt-2 font-mono text-[10px] text-zinc-500">
          Geplant {formatDateTime(item.scheduledAt)}
        </div>
      )}
      {item.publishedAt && (
        <div className="mt-1 font-mono text-[10px] text-zinc-500">
          Live {formatDateTime(item.publishedAt)}
        </div>
      )}
    </div>
  );
}

export default function CoContentKanbanPage() {
  const map = new Map<ContentStage, ContentItem[]>();
  CONTENT_STAGES.forEach((s) => map.set(s, []));
  mockContent.forEach((c) => {
    map.get(c.stage)?.push(c);
  });

  return (
    <div className="space-y-4">
      <CoSectionHeader
        title="Content-Pipeline"
        description="Kanban nach Produktionsstufe — von Idee bis veröffentlicht."
      />

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {CONTENT_STAGES.map((stage) => {
          const items = map.get(stage) ?? [];
          return (
            <div
              key={stage}
              className={cn(
                'flex w-[260px] shrink-0 flex-col rounded-lg border border-zinc-700/80 bg-zinc-950/40',
              )}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                <CoContentStageBadge stage={stage} />
                <span className="font-mono text-xs text-zinc-500">{items.length}</span>
              </div>
              <div className="flex max-h-[min(70vh,560px)] flex-col gap-2 overflow-y-auto p-2">
                {items.length === 0 && (
                  <div className="py-6 text-center text-[11px] text-zinc-600">Leer</div>
                )}
                {items.map((item) => (
                  <KanbanCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
