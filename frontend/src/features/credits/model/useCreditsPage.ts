'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/shared/store/store';
import { creditsApi } from '../api/credits.api';
import { CREDITS_PAGE_TEXTS } from './credits.constants';

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

export function useCreditsPage() {
  const { isAuthenticated, isHydrated } = useSelector(
    (state: RootState) => state.auth,
  );
  const router = useRouter();
  const queryClient = useQueryClient();
  const [plansPage, setPlansPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [popup, setPopup] = useState<PopupState>(DEFAULT_POPUP_STATE);

  const isReady = isHydrated && isAuthenticated;

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  const balanceQuery = useQuery({
    queryKey: ['credits-balance'],
    queryFn: creditsApi.getBalance,
    enabled: isReady,
  });

  const plansQuery = useQuery({
    queryKey: ['credits-plans', plansPage],
    queryFn: () => creditsApi.getPlans({ page: plansPage, limit: 6 }),
    enabled: isReady,
  });

  const historyQuery = useQuery({
    queryKey: ['credits-history', historyPage],
    queryFn: () => creditsApi.getHistory({ page: historyPage, limit: 8 }),
    enabled: isReady,
  });

  const purchasesQuery = useQuery({
    queryKey: ['credits-purchases', purchasePage],
    queryFn: () => creditsApi.getPurchases({ page: purchasePage, limit: 8 }),
    enabled: isReady,
  });

  const checkoutMutation = useMutation({
    mutationFn: (creditPlanId: string) => creditsApi.checkout({ creditPlanId }),
    onSuccess: async () => {
      setFeedbackMessage(CREDITS_PAGE_TEXTS.purchaseQueued);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['credits-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['credits-plans'] }),
        queryClient.invalidateQueries({ queryKey: ['credits-history'] }),
        queryClient.invalidateQueries({ queryKey: ['credits-purchases'] }),
      ]);
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: CREDITS_PAGE_TEXTS.genericError,
        message: CREDITS_PAGE_TEXTS.genericError,
        variant: 'error',
      });
    },
  });

  const consumeMutation = useMutation({
    mutationFn: () =>
      creditsApi.consume({
        amount: 500,
        description: CREDITS_PAGE_TEXTS.consumeOperationDescription,
      }),
    onSuccess: async () => {
      setFeedbackMessage('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['credits-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['credits-history'] }),
      ]);
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: CREDITS_PAGE_TEXTS.insufficientTitle,
        message: CREDITS_PAGE_TEXTS.insufficientMessage,
        variant: 'warning',
      });
    },
  });

  function closePopup(): void {
    setPopup(DEFAULT_POPUP_STATE);
  }

  return {
    isReady,
    plansPage,
    historyPage,
    purchasePage,
    feedbackMessage,
    popup,
    balanceQuery,
    plansQuery,
    historyQuery,
    purchasesQuery,
    checkoutMutation,
    consumeMutation,
    setPlansPage,
    setHistoryPage,
    setPurchasePage,
    closePopup,
  };
}
