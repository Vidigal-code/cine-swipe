import { FormEvent } from 'react';
import { Input } from '@/shared/ui/input/Input';
import { Button } from '@/shared/ui/button/Button';

interface ProfileDetailsFormProps {
  title: string;
  saveLabel: string;
  username: string;
  email: string;
  isPending: boolean;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function ProfileDetailsForm({
  title,
  saveLabel,
  username,
  email,
  isPending,
  onUsernameChange,
  onEmailChange,
  onSubmit,
}: ProfileDetailsFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-5 min-h-[19rem] flex flex-col justify-between"
    >
      <div>
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>
        <div className="space-y-3">
          <Input
            label="Nome de usuario"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </div>
      </div>
      <Button type="submit" isLoading={isPending}>
        {saveLabel}
      </Button>
    </form>
  );
}
