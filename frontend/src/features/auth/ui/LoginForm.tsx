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
import { LOGIN_PAGE_NAVIGATION_ITEMS } from '../model/auth-navigation.constants';

const AUTH_TEXTS = {
    title: 'Bem-vindo de volta',
    emailLabel: 'E-mail',
    passwordLabel: 'Senha',
    submitButton: 'Entrar',
    submittingButton: 'Entrando...',
    invalidCredentials: 'Credenciais inválidas',
};

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const mutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            dispatch(loginSuccess(data));
            if (data.user?.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({ email, password });
    };

    return (
        <div className="w-full max-w-md mx-auto p-8 rounded-xl shadow-lg bg-card backdrop-blur-md border border-border">
            <h2 className="text-3xl font-bold text-center text-card-foreground mb-6">{AUTH_TEXTS.title}</h2>
            {mutation.isError && <p className="text-red-500 mb-4 text-sm text-center">{AUTH_TEXTS.invalidCredentials}</p>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label={AUTH_TEXTS.emailLabel}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <Input
                    label={AUTH_TEXTS.passwordLabel}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <Button
                    type="submit"
                    isLoading={mutation.isPending}
                >
                    {mutation.isPending ? AUTH_TEXTS.submittingButton : AUTH_TEXTS.submitButton}
                </Button>
            </form>

            <AuthFormFooterLinks items={LOGIN_PAGE_NAVIGATION_ITEMS} />
        </div>
    );
}
