'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.api';
import { loginSuccess } from '../model/authSlice';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';
import type { AppDispatch } from '@/shared/store/store';
import { AuthFormFooterLinks } from './AuthFormFooterLinks';
import { REGISTER_PAGE_NAVIGATION_ITEMS } from '../model/auth-navigation.constants';

const AUTH_TEXTS = {
  title: 'Criar Conta',
  emailLabel: 'E-mail',
  passwordLabel: 'Senha',
  referralCodeLabel: 'Codigo de indicacao (opcional)',
  passwordHint: 'Use 8-64 caracteres com maiuscula, minuscula, numero e simbolo.',
  submitButton: 'Cadastrar',
  submittingButton: 'Criando...',
  registrationFailed: 'Falha ao criar conta',
};
const STRONG_PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,64}$';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      if (data.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate({
      email,
      password,
      role: 'USER',
      referralCode: referralCode.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-xl shadow-lg bg-card backdrop-blur-md border border-border">
      <h2 className="text-3xl font-bold text-center text-card-foreground mb-6">
        {AUTH_TEXTS.title}
      </h2>
      {mutation.isError && (
        <p className="text-red-500 mb-4 text-sm text-center">
          {AUTH_TEXTS.registrationFailed}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={AUTH_TEXTS.emailLabel}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          label={AUTH_TEXTS.passwordLabel}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          pattern={STRONG_PASSWORD_PATTERN}
          title={AUTH_TEXTS.passwordHint}
          required
        />
        <Input
          label={AUTH_TEXTS.referralCodeLabel}
          value={referralCode}
          onChange={(event) => setReferralCode(event.target.value)}
        />
        <p className="text-xs text-muted-foreground text-center">
          {AUTH_TEXTS.passwordHint}
        </p>

        <Button type="submit" className="mt-4" isLoading={mutation.isPending}>
          {mutation.isPending
            ? AUTH_TEXTS.submittingButton
            : AUTH_TEXTS.submitButton}
        </Button>
      </form>

      <AuthFormFooterLinks items={REGISTER_PAGE_NAVIGATION_ITEMS} />
    </div>
  );
}
