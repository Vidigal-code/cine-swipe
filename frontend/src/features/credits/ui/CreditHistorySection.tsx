import type { CreditTransaction } from '@/entities/credit/model/types';
import type { PaginationMeta } from '@/entities/movie/model/types';
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls';
import { resolveCreditTransactionTypeLabel } from '@/entities/credit/model/credit-labels.pt-br';

interface CreditHistorySectionProps {
  title: string;
  entries: CreditTransaction[];
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function CreditHistorySection({
  title,
  entries,
  meta,
  onPageChange,
}: CreditHistorySectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 min-h-[16rem]">
      <h2 className="text-xl font-semibold text-card-foreground text-center mb-4">
        {title}
      </h2>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border border-border bg-background p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left gap-2"
          >
            <span className="text-sm text-muted-foreground">
              {resolveCreditTransactionTypeLabel(entry.type)}
            </span>
            <span className="font-semibold">
              {entry.amount > 0 ? '+' : ''}
              {entry.amount}
            </span>
          </div>
        ))}
      </div>
      {meta && <PaginationControls meta={meta} onPageChange={onPageChange} />}
    </section>
  );
}
