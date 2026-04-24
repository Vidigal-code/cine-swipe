import type { CreditPlan } from '@/entities/credit/model/types';
import type { PaginationMeta } from '@/entities/movie/model/types';
import { Button } from '@/shared/ui/button/Button';
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls';

interface CreditPlansSectionProps {
  title: string;
  plans: CreditPlan[];
  meta?: PaginationMeta;
  checkoutButtonLabel: string;
  checkoutPendingLabel: string;
  isCheckoutPending: boolean;
  onCheckout: (planId: string) => void;
  onPageChange: (page: number) => void;
}

export function CreditPlansSection({
  title,
  plans,
  meta,
  checkoutButtonLabel,
  checkoutPendingLabel,
  isCheckoutPending,
  onCheckout,
  onPageChange,
}: CreditPlansSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 min-h-[18rem]">
      <h2 className="text-xl font-semibold text-card-foreground text-center mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="rounded-xl border border-border bg-background p-4 min-h-[12rem] flex flex-col justify-between text-center"
          >
            <div>
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-muted-foreground mt-1">{plan.creditsAmount} créditos</p>
              <p className="text-primary font-bold mt-2">
                R$ {Number(plan.priceBrl).toFixed(2)}
              </p>
            </div>
            <Button
              className="mt-4"
              isLoading={isCheckoutPending}
              onClick={() => onCheckout(plan.id)}
            >
              {isCheckoutPending ? checkoutPendingLabel : checkoutButtonLabel}
            </Button>
          </article>
        ))}
      </div>
      {meta && <PaginationControls meta={meta} onPageChange={onPageChange} />}
    </section>
  );
}
