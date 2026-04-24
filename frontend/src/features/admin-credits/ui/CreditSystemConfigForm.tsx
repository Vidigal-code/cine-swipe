import { FormEvent } from 'react';
import { Input } from '@/shared/ui/input/Input';
import { Button } from '@/shared/ui/button/Button';
import { Checkbox } from '@/shared/ui/checkbox/Checkbox';

interface ConfigFormState {
  registrationBonusCredits: number;
  referralEnabled: boolean;
  refereeRegistrationBonusCredits: number;
  referrerFirstPurchaseBonusCredits: number;
}

interface CreditSystemConfigFormProps {
  title: string;
  submitLabel: string;
  isPending: boolean;
  form: ConfigFormState;
  onChange: (next: ConfigFormState) => void;
  onSubmit: (event: FormEvent) => void;
}

export function CreditSystemConfigForm({
  title,
  submitLabel,
  isPending,
  form,
  onChange,
  onSubmit,
}: CreditSystemConfigFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-5 min-h-[20rem] flex flex-col justify-between"
    >
      <div>
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>
        <div className="space-y-3">
          <Input
            label="Bonus de cadastro"
            type="number"
            min={0}
            value={String(form.registrationBonusCredits)}
            onChange={(event) =>
              onChange({
                ...form,
                registrationBonusCredits: Number(event.target.value),
              })
            }
          />
          <Input
            label="Bonus para indicado no cadastro"
            type="number"
            min={0}
            value={String(form.refereeRegistrationBonusCredits)}
            onChange={(event) =>
              onChange({
                ...form,
                refereeRegistrationBonusCredits: Number(event.target.value),
              })
            }
          />
          <Input
            label="Bonus para indicador na primeira compra"
            type="number"
            min={0}
            value={String(form.referrerFirstPurchaseBonusCredits)}
            onChange={(event) =>
              onChange({
                ...form,
                referrerFirstPurchaseBonusCredits: Number(event.target.value),
              })
            }
          />
          <Checkbox
            label="Indicacao habilitada globalmente"
            checked={form.referralEnabled}
            onChange={(event) =>
              onChange({
                ...form,
                referralEnabled: event.target.checked,
              })
            }
            rowClassName="justify-center"
          />
        </div>
      </div>
      <Button type="submit" isLoading={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
