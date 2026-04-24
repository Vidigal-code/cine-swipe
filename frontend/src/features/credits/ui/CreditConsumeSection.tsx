import { Button } from '@/shared/ui/button/Button';

interface CreditConsumeSectionProps {
  title: string;
  description: string;
  buttonLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onConsume: () => void;
}

export function CreditConsumeSection({
  title,
  description,
  buttonLabel,
  pendingLabel,
  isPending,
  onConsume,
}: CreditConsumeSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 min-h-[9rem] text-center flex flex-col justify-center items-center">
      <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
      <Button
        className="mt-4 w-full sm:w-auto sm:min-w-[14rem]"
        onClick={onConsume}
        isLoading={isPending}
      >
        {isPending ? pendingLabel : buttonLabel}
      </Button>
    </section>
  );
}
