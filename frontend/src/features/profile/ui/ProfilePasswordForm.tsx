import { FormEvent } from 'react';
import { Input } from '@/shared/ui/input/Input';
import { Button } from '@/shared/ui/button/Button';

interface ProfilePasswordFormProps {
  title: string;
  saveLabel: string;
  currentPassword: string;
  newPassword: string;
  isPending: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function ProfilePasswordForm({
  title,
  saveLabel,
  currentPassword,
  newPassword,
  isPending,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onSubmit,
}: ProfilePasswordFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-5 min-h-[19rem] flex flex-col justify-between"
    >
      <div>
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>
        <div className="space-y-3">
          <Input
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={(event) => onCurrentPasswordChange(event.target.value)}
          />
          <Input
            label="Nova senha forte"
            type="password"
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
          />
        </div>
      </div>
      <Button type="submit" isLoading={isPending}>
        {saveLabel}
      </Button>
    </form>
  );
}
