'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/shared/store/store';
import { adminUsersApi } from '../api/admin-users.api';
import { ADMIN_USERS_TEXTS } from './admin-users.constants';
import type { AdminUserRecord, AdminUserRole } from './admin-users.types';

type PopupVariant = 'info' | 'success' | 'warning' | 'error';

interface PopupState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: PopupVariant;
}

interface UserFormState {
  username: string;
  email: string;
  role: AdminUserRole;
}

interface CreateUserFormState extends UserFormState {
  password: string;
}

const DEFAULT_POPUP_STATE: PopupState = {
  isOpen: false,
  title: '',
  message: '',
  variant: 'info',
};

const DEFAULT_CREATE_FORM: CreateUserFormState = {
  username: '',
  email: '',
  password: '',
  role: 'USER',
};

const DEFAULT_EDIT_FORM: UserFormState = {
  username: '',
  email: '',
  role: 'USER',
};

export function useAdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isHydrated, user } = useSelector(
    (state: RootState) => state.auth,
  );

  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [popup, setPopup] = useState<PopupState>(DEFAULT_POPUP_STATE);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(DEFAULT_CREATE_FORM);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserFormState>(DEFAULT_EDIT_FORM);

  const isReady = isHydrated && isAuthenticated && user?.role === 'ADMIN';

  useEffect(() => {
    if (isHydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, user?.role, router]);

  const usersQuery = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminUsersApi.getUsers({ page, limit: 10 }),
    enabled: isReady,
  });

  const createMutation = useMutation({
    mutationFn: adminUsersApi.createUser,
    onSuccess: async () => {
      setFeedback(ADMIN_USERS_TEXTS.createSuccess);
      setCreateForm(DEFAULT_CREATE_FORM);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      openErrorPopup();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserFormState }) =>
      adminUsersApi.updateUser(id, {
        username: payload.username,
        email: payload.email,
      }),
    onSuccess: async () => {
      setFeedback(ADMIN_USERS_TEXTS.updateSuccess);
      cancelEdit();
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      openErrorPopup();
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: string;
      role: AdminUserRole;
    }) => adminUsersApi.updateUserRole(id, { role }),
    onSuccess: async () => {
      setFeedback(ADMIN_USERS_TEXTS.roleSuccess);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      openErrorPopup();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminUsersApi.deleteUser,
    onSuccess: async () => {
      setFeedback(ADMIN_USERS_TEXTS.deleteSuccess);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      openErrorPopup();
    },
  });

  const users = useMemo(() => usersQuery.data?.data ?? [], [usersQuery.data?.data]);

  function handleCreateSubmit(event: FormEvent): void {
    event.preventDefault();
    createMutation.mutate(createForm);
  }

  function startEdit(userRecord: AdminUserRecord): void {
    setEditingUserId(userRecord.id);
    setEditForm({
      username: userRecord.username,
      email: userRecord.email,
      role: userRecord.role,
    });
  }

  function cancelEdit(): void {
    setEditingUserId(null);
    setEditForm(DEFAULT_EDIT_FORM);
  }

  function handleEditSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!editingUserId) {
      return;
    }
    updateMutation.mutate({
      id: editingUserId,
      payload: editForm,
    });
  }

  function toggleRole(userRecord: AdminUserRecord): void {
    const nextRole: AdminUserRole = userRecord.role === 'ADMIN' ? 'USER' : 'ADMIN';
    roleMutation.mutate({
      id: userRecord.id,
      role: nextRole,
    });
  }

  function removeUser(userId: string): void {
    deleteMutation.mutate(userId);
  }

  function closePopup(): void {
    setPopup(DEFAULT_POPUP_STATE);
  }

  function openErrorPopup(): void {
    setPopup({
      isOpen: true,
      title: ADMIN_USERS_TEXTS.genericError,
      message: ADMIN_USERS_TEXTS.genericError,
      variant: 'error',
    });
  }

  return {
    isReady,
    page,
    feedback,
    popup,
    users,
    usersQuery,
    createForm,
    editForm,
    editingUserId,
    createMutation,
    updateMutation,
    roleMutation,
    deleteMutation,
    setPage,
    setCreateForm,
    setEditForm,
    handleCreateSubmit,
    startEdit,
    cancelEdit,
    handleEditSubmit,
    toggleRole,
    removeUser,
    closePopup,
  };
}
