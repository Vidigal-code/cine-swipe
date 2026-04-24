'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState, type AppDispatch } from '@/shared/store/store';
import { profileApi } from '../api/profile.api';
import { loginSuccess } from '@/features/auth/model/authSlice';
import { PROFILE_PAGE_TEXTS } from './profile.constants';

type PopupVariant = 'info' | 'success' | 'warning' | 'error';

interface PopupState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: PopupVariant;
}

const DEFAULT_POPUP_STATE: PopupState = {
  isOpen: false,
  title: '',
  message: '',
  variant: 'info',
};

export function useProfilePage() {
  const { isAuthenticated, isHydrated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [popup, setPopup] = useState<PopupState>(DEFAULT_POPUP_STATE);

  const isReady = isHydrated && isAuthenticated;

  useEffect(() => {
    setUsername(user?.username ?? '');
    setEmail(user?.email ?? '');
  }, [user?.username, user?.email]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      setFeedback(PROFILE_PAGE_TEXTS.profileUpdated);
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: PROFILE_PAGE_TEXTS.profileUpdateError,
        message: PROFILE_PAGE_TEXTS.profileUpdateError,
        variant: 'error',
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: profileApi.updatePassword,
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setFeedback(PROFILE_PAGE_TEXTS.passwordUpdated);
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: PROFILE_PAGE_TEXTS.passwordUpdateError,
        message: PROFILE_PAGE_TEXTS.passwordUpdateError,
        variant: 'error',
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      setAvatarFile(null);
      setFeedback(PROFILE_PAGE_TEXTS.avatarUpdated);
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: PROFILE_PAGE_TEXTS.avatarUploadError,
        message: PROFILE_PAGE_TEXTS.avatarUploadError,
        variant: 'error',
      });
    },
  });

  function handleProfileSubmit(event: FormEvent): void {
    event.preventDefault();
    updateProfileMutation.mutate({ username, email });
  }

  function handlePasswordSubmit(event: FormEvent): void {
    event.preventDefault();
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  }

  function handleAvatarSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!avatarFile) {
      setPopup({
        isOpen: true,
        title: PROFILE_PAGE_TEXTS.avatarUploadError,
        message: PROFILE_PAGE_TEXTS.selectFileError,
        variant: 'warning',
      });
      return;
    }
    uploadAvatarMutation.mutate(avatarFile);
  }

  function closePopup(): void {
    setPopup(DEFAULT_POPUP_STATE);
  }

  return {
    user,
    isReady,
    username,
    email,
    currentPassword,
    newPassword,
    avatarFile,
    avatarPreviewUrl,
    feedback,
    popup,
    updateProfileMutation,
    updatePasswordMutation,
    uploadAvatarMutation,
    setUsername,
    setEmail,
    setCurrentPassword,
    setNewPassword,
    setAvatarFile,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleAvatarSubmit,
    closePopup,
  };
}
