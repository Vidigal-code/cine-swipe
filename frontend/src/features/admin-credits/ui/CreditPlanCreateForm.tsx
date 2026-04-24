import { FormEvent } from 'react';
import { Input } from '@/shared/ui/input/Input';
import { Button } from '@/shared/ui/button/Button';
import { Checkbox } from '@/shared/ui/checkbox/Checkbox';

interface CreditPlanCreateFormProps {
  title: string;
  createLabel: string;
  name: string;
  creditsAmount: string;
  priceBrl: string;
  isActive: boolean;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onCreditsAmountChange: (value: string) => void;
  onPriceBrlChange: (value: string) => void;
  onIsActiveChange: (value: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}

export function CreditPlanCreateForm({
  title,
  createLabel,
  name,
  creditsAmount,
  priceBrl,
  isActive,
  isPending,
  onNameChange,
  onCreditsAmountChange,
  onPriceBrlChange,
  onIsActiveChange,
  onSubmit,
}: CreditPlanCreateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-5 min-h-[20rem] flex flex-col justify-between"
    >
      <div>
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>
        <div className="space-y-3">
          <Input
            label="Nome do plano"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
          />
          <Input
            label="Creditos"
            type="number"
            min={1}
            value={creditsAmount}
            onChange={(event) => onCreditsAmountChange(event.target.value)}
            required
          />
          <Input
            label="Preco BRL"
            type="number"
            step="0.01"
            min={0.01}
            value={priceBrl}
            onChange={(event) => onPriceBrlChange(event.target.value)}
            required
          />
          <Checkbox
            label="Plano ativo"
            checked={isActive}
            onChange={(event) => onIsActiveChange(event.target.checked)}
            rowClassName="justify-center"
          />
        </div>
      </div>
      <Button type="submit" isLoading={isPending}>
        {createLabel}
      </Button>
    </form>
  );
}
