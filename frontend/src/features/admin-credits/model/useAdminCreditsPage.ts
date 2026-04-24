'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/shared/store/store';
import { adminCreditsApi } from '../api/admin-credits.api';
import { ADMIN_CREDITS_TEXTS } from './admin-credits.constants';
import type { CreditPlan } from '@/entities/credit/model/types';

type PopupVariant = 'info' | 'success' | 'warning' | 'error';

interface PopupState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: PopupVariant;
}

interface ConfigFormState {
  registrationBonusCredits: number;
  referralEnabled: boolean;
  refereeRegistrationBonusCredits: number;
  referrerFirstPurchaseBonusCredits: number;
}

interface PlanFormState {
  name: string;
  creditsAmount: string;
  priceBrl: string;
  isActive: boolean;
}

const DEFAULT_POPUP_STATE: PopupState = {
  isOpen: false,
  title: '',
  message: '',
  variant: 'info',
};

const DEFAULT_CONFIG_FORM: ConfigFormState = {
  registrationBonusCredits: 250,
  referralEnabled: true,
  refereeRegistrationBonusCredits: 50,
  referrerFirstPurchaseBonusCredits: 100,
};

const DEFAULT_PLAN_EDIT_FORM: PlanFormState = {
  name: '',
  creditsAmount: '',
  priceBrl: '',
  isActive: true,
};

export function useAdminCreditsPage() {
  const { isAuthenticated, isHydrated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [popup, setPopup] = useState<PopupState>(DEFAULT_POPUP_STATE);

  const [name, setName] = useState('');
  const [creditsAmount, setCreditsAmount] = useState('250');
  const [priceBrl, setPriceBrl] = useState('19.90');
  const [isActive, setIsActive] = useState(true);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanForm, setEditPlanForm] = useState<PlanFormState>(DEFAULT_PLAN_EDIT_FORM);
  const [configForm, setConfigForm] = useState<ConfigFormState>(DEFAULT_CONFIG_FORM);

  const isReady = isHydrated && isAuthenticated && user?.role === 'ADMIN';

  useEffect(() => {
    if (isHydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, user?.role, router]);

  const plansQuery = useQuery({
    queryKey: ['admin-credit-plans', page],
    queryFn: () => adminCreditsApi.getPlans({ page, limit: 10 }),
    enabled: isReady,
  });

  const configQuery = useQuery({
    queryKey: ['admin-credit-config'],
    queryFn: adminCreditsApi.getConfig,
    enabled: isReady,
  });

  useEffect(() => {
    if (configQuery.data) {
      setConfigForm({
        registrationBonusCredits: configQuery.data.registrationBonusCredits,
        referralEnabled: configQuery.data.referralEnabled,
        refereeRegistrationBonusCredits:
          configQuery.data.refereeRegistrationBonusCredits,
        referrerFirstPurchaseBonusCredits:
          configQuery.data.referrerFirstPurchaseBonusCredits,
      });
    }
  }, [configQuery.data]);

  const createPlanMutation = useMutation({
    mutationFn: adminCreditsApi.createPlan,
    onSuccess: async () => {
      setFeedback(ADMIN_CREDITS_TEXTS.planCreated);
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['admin-credit-plans'] });
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: ADMIN_CREDITS_TEXTS.planCreateError,
        message: ADMIN_CREDITS_TEXTS.planCreateError,
        variant: 'error',
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: adminCreditsApi.deletePlan,
    onSuccess: async () => {
      setFeedback(ADMIN_CREDITS_TEXTS.planDeleted);
      await queryClient.invalidateQueries({ queryKey: ['admin-credit-plans'] });
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: ADMIN_CREDITS_TEXTS.planDeleteError,
        message: ADMIN_CREDITS_TEXTS.planDeleteError,
        variant: 'error',
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        name: string;
        creditsAmount: number;
        priceBrl: number;
        isActive: boolean;
      };
    }) =>
      adminCreditsApi.updatePlan(id, payload),
    onSuccess: async () => {
      setFeedback(ADMIN_CREDITS_TEXTS.planUpdated);
      cancelPlanEdit();
      await queryClient.invalidateQueries({ queryKey: ['admin-credit-plans'] });
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: ADMIN_CREDITS_TEXTS.planUpdateError,
        message: ADMIN_CREDITS_TEXTS.planUpdateError,
        variant: 'error',
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: adminCreditsApi.updateConfig,
    onSuccess: async () => {
      setFeedback(ADMIN_CREDITS_TEXTS.configUpdated);
      await queryClient.invalidateQueries({ queryKey: ['admin-credit-config'] });
    },
    onError: () => {
      setPopup({
        isOpen: true,
        title: ADMIN_CREDITS_TEXTS.configUpdateError,
        message: ADMIN_CREDITS_TEXTS.configUpdateError,
        variant: 'error',
      });
    },
  });

  const plans = useMemo(() => plansQuery.data?.data ?? [], [plansQuery.data?.data]);

  function handleCreatePlan(event: FormEvent): void {
    event.preventDefault();
    createPlanMutation.mutate({
      name,
      creditsAmount: Number(creditsAmount),
      priceBrl: Number(priceBrl),
      isActive,
    });
  }

  function handleConfigSubmit(event: FormEvent): void {
    event.preventDefault();
    updateConfigMutation.mutate(configForm);
  }

  function startPlanEdit(plan: CreditPlan): void {
    setEditingPlanId(plan.id);
    setEditPlanForm({
      name: plan.name,
      creditsAmount: String(plan.creditsAmount),
      priceBrl: String(plan.priceBrl),
      isActive: plan.isActive,
    });
  }

  function cancelPlanEdit(): void {
    setEditingPlanId(null);
    setEditPlanForm(DEFAULT_PLAN_EDIT_FORM);
  }

  function handlePlanEditSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!editingPlanId) {
      return;
    }
    updatePlanMutation.mutate({
      id: editingPlanId,
      payload: {
        name: editPlanForm.name,
        creditsAmount: Number(editPlanForm.creditsAmount),
        priceBrl: Number(editPlanForm.priceBrl),
        isActive: editPlanForm.isActive,
      },
    });
  }

  function closePopup(): void {
    setPopup(DEFAULT_POPUP_STATE);
  }

  return {
    isReady,
    page,
    feedback,
    popup,
    name,
    creditsAmount,
    priceBrl,
    isActive,
    editingPlanId,
    editPlanForm,
    configForm,
    plans,
    plansQuery,
    createPlanMutation,
    deletePlanMutation,
    updatePlanMutation,
    updateConfigMutation,
    setPage,
    setName,
    setCreditsAmount,
    setPriceBrl,
    setIsActive,
    setEditPlanForm,
    setConfigForm,
    handleCreatePlan,
    startPlanEdit,
    cancelPlanEdit,
    handlePlanEditSubmit,
    handleConfigSubmit,
    closePopup,
  };
}
