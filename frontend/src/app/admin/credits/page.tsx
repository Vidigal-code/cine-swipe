'use client';

import { Navbar } from '@/widgets/navbar/ui/Navbar';
import { ResponsivePopup } from '@/shared/ui/feedback/ResponsivePopup';
import { ADMIN_CREDITS_TEXTS } from '@/features/admin-credits/model/admin-credits.constants';
import { useAdminCreditsPage } from '@/features/admin-credits/model/useAdminCreditsPage';
import { AdminCreditsHeaderSection } from '@/features/admin-credits/ui/AdminCreditsHeaderSection';
import { CreditPlanCreateForm } from '@/features/admin-credits/ui/CreditPlanCreateForm';
import { CreditPlanEditForm } from '@/features/admin-credits/ui/CreditPlanEditForm';
import { CreditSystemConfigForm } from '@/features/admin-credits/ui/CreditSystemConfigForm';
import { CreditPlanListSection } from '@/features/admin-credits/ui/CreditPlanListSection';

export default function AdminCreditsPage() {
  const {
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
  } = useAdminCreditsPage();

  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <AdminCreditsHeaderSection
          title={ADMIN_CREDITS_TEXTS.title}
          subtitle={ADMIN_CREDITS_TEXTS.subtitle}
          feedbackMessage={feedback}
        />

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <CreditPlanCreateForm
            title={ADMIN_CREDITS_TEXTS.planSection}
            createLabel={ADMIN_CREDITS_TEXTS.createPlan}
            name={name}
            creditsAmount={creditsAmount}
            priceBrl={priceBrl}
            isActive={isActive}
            isPending={createPlanMutation.isPending}
            onNameChange={setName}
            onCreditsAmountChange={setCreditsAmount}
            onPriceBrlChange={setPriceBrl}
            onIsActiveChange={setIsActive}
            onSubmit={handleCreatePlan}
          />

          {editingPlanId ? (
            <CreditPlanEditForm
              title={ADMIN_CREDITS_TEXTS.planEditSection}
              updateLabel={ADMIN_CREDITS_TEXTS.updatePlan}
              cancelLabel={ADMIN_CREDITS_TEXTS.cancelPlanEdit}
              name={editPlanForm.name}
              creditsAmount={editPlanForm.creditsAmount}
              priceBrl={editPlanForm.priceBrl}
              isActive={editPlanForm.isActive}
              isPending={updatePlanMutation.isPending}
              onNameChange={(value) =>
                setEditPlanForm((current) => ({ ...current, name: value }))
              }
              onCreditsAmountChange={(value) =>
                setEditPlanForm((current) => ({
                  ...current,
                  creditsAmount: value,
                }))
              }
              onPriceBrlChange={(value) =>
                setEditPlanForm((current) => ({ ...current, priceBrl: value }))
              }
              onIsActiveChange={(value) =>
                setEditPlanForm((current) => ({ ...current, isActive: value }))
              }
              onSubmit={handlePlanEditSubmit}
              onCancel={cancelPlanEdit}
            />
          ) : (
            <section className="rounded-2xl border border-border bg-card p-5 min-h-[20rem] flex items-center justify-center text-center text-muted-foreground">
              Selecione um plano na lista para editar.
            </section>
          )}

          <CreditSystemConfigForm
            title={ADMIN_CREDITS_TEXTS.configSection}
            submitLabel={ADMIN_CREDITS_TEXTS.updateConfig}
            isPending={updateConfigMutation.isPending}
            form={configForm}
            onChange={setConfigForm}
            onSubmit={handleConfigSubmit}
          />
        </section>

        <CreditPlanListSection
          plans={plans}
          editLabel={ADMIN_CREDITS_TEXTS.editPlan}
          deleteLabel={ADMIN_CREDITS_TEXTS.deletePlan}
          meta={plansQuery.data?.meta}
          onPageChange={(nextPage) => {
            if (nextPage !== page) {
              setPage(nextPage);
            }
          }}
          onEdit={startPlanEdit}
          onToggleActive={(plan) => {
            updatePlanMutation.mutate({
              id: plan.id,
              payload: {
                name: plan.name,
                creditsAmount: plan.creditsAmount,
                priceBrl: Number(plan.priceBrl),
                isActive: !plan.isActive,
              },
            });
          }}
          onDelete={(planId) => deletePlanMutation.mutate(planId)}
        />
      </main>

      <ResponsivePopup
        isOpen={popup.isOpen}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        onClose={closePopup}
      />
    </div>
  );
}
