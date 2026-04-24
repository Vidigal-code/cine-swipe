import { FormEvent } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';

interface AdminUsersEditFormProps {
  title: string;
  usernameLabel: string;
  emailLabel: string;
  submitLabel: string;
  cancelLabel: string;
  isPending: boolean;
  username: string;
  email: string;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}

export function AdminUsersEditForm({
  title,
  usernameLabel,
  emailLabel,
  submitLabel,
  cancelLabel,
  isPending,
  username,
  email,
  onUsernameChange,
  onEmailChange,
  onSubmit,
  onCancel,
}: AdminUsersEditFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-5 min-h-[20rem] flex flex-col justify-between"
    >
      <div>
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>
        <div className="space-y-3">
          <Input
            label={usernameLabel}
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            required
          />
          <Input
            label={emailLabel}
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="submit" isLoading={isPending}>
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
}
