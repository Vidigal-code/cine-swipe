import type { CreditPlan } from '@/entities/credit/model/types';
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls';
import type { PaginationMeta } from '@/entities/movie/model/types';
import { Button } from '@/shared/ui/button/Button';

interface CreditPlanListSectionProps {
  plans: CreditPlan[];
  editLabel: string;
  deleteLabel: string;
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  onEdit: (plan: CreditPlan) => void;
  onToggleActive: (plan: CreditPlan) => void;
  onDelete: (planId: string) => void;
}

export function CreditPlanListSection({
  plans,
  editLabel,
  deleteLabel,
  meta,
  onPageChange,
  onEdit,
  onToggleActive,
  onDelete,
}: CreditPlanListSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 min-h-[16rem]">
      <div className="space-y-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-lg border border-border bg-background p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-center md:text-left"
          >
            <div>
              <p className="font-semibold">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {plan.creditsAmount} creditos - R$ {Number(plan.priceBrl).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2 justify-center md:justify-end">
              <Button
                variant="outline"
                className="w-auto h-10 px-4"
                onClick={() => onEdit(plan)}
              >
                {editLabel}
              </Button>
              <Button
                variant="outline"
                className="w-auto h-10 px-4"
                onClick={() => onToggleActive(plan)}
              >
                {plan.isActive ? 'Desativar' : 'Ativar'}
              </Button>
              <Button
                variant="secondary"
                className="w-auto h-10 px-4 bg-red-600 text-white hover:bg-red-700"
                onClick={() => onDelete(plan.id)}
              >
                {deleteLabel}
              </Button>
            </div>
          </div>
        ))}
      </div>
      {meta && <PaginationControls meta={meta} onPageChange={onPageChange} />}
    </section>
  );
}
