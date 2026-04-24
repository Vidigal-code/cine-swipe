import { FormEvent } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';
import { Select } from '@/shared/ui/select/Select';
import type { AdminUserRole } from '../model/admin-users.types';

interface AdminUsersCreateFormProps {
  title: string;
  usernameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  roleLabel: string;
  submitLabel: string;
  isPending: boolean;
  username: string;
  email: string;
  password: string;
  role: AdminUserRole;
  roleOptions: Array<{ value: AdminUserRole; label: string }>;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRoleChange: (value: AdminUserRole) => void;
  onSubmit: (event: FormEvent) => void;
}

export function AdminUsersCreateForm({
  title,
  usernameLabel,
  emailLabel,
  passwordLabel,
  roleLabel,
  submitLabel,
  isPending,
  username,
  email,
  password,
  role,
  roleOptions,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onRoleChange,
  onSubmit,
}: AdminUsersCreateFormProps) {
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
          <Input
            label={passwordLabel}
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            required
          />
          <Select
            label={roleLabel}
            value={role}
            options={roleOptions}
            onChange={(event) => onRoleChange(event.target.value as AdminUserRole)}
          />
        </div>
      </div>
      <Button type="submit" isLoading={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
