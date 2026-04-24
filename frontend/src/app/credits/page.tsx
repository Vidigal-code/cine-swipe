'use client';

import { Navbar } from '@/widgets/navbar/ui/Navbar';
import { ResponsivePopup } from '@/shared/ui/feedback/ResponsivePopup';
import { useCreditsPage } from '@/features/credits/model/useCreditsPage';
import { CREDITS_PAGE_TEXTS } from '@/features/credits/model/credits.constants';
import { CreditHeroSection } from '@/features/credits/ui/CreditHeroSection';
import { CreditPlansSection } from '@/features/credits/ui/CreditPlansSection';
import { CreditConsumeSection } from '@/features/credits/ui/CreditConsumeSection';
import { CreditHistorySection } from '@/features/credits/ui/CreditHistorySection';
import { CreditPurchasesSection } from '@/features/credits/ui/CreditPurchasesSection';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '@/features/auth/model/auth.selectors';

export default function CreditsPage() {
  const isAdmin = useSelector(selectIsAdmin);

  const {
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
  } = useCreditsPage();

  const handlePlansPageChange = createPageChangeHandler(plansPage, setPlansPage);
  const handleHistoryPageChange = createPageChangeHandler(
    historyPage,
    setHistoryPage,
  );
  const handlePurchasePageChange = createPageChangeHandler(
    purchasePage,
    setPurchasePage,
  );

  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <CreditHeroSection
          title={CREDITS_PAGE_TEXTS.title}
          subtitle={CREDITS_PAGE_TEXTS.subtitle}
          currentBalanceLabel={CREDITS_PAGE_TEXTS.currentBalance}
          balance={balanceQuery.data?.balance ?? 0}
          feedbackMessage={feedbackMessage}
        />

        <CreditPlansSection
          title={CREDITS_PAGE_TEXTS.plansTitle}
          plans={plansQuery.data?.data ?? []}
          meta={plansQuery.data?.meta}
          checkoutButtonLabel={CREDITS_PAGE_TEXTS.checkoutButton}
          checkoutPendingLabel={CREDITS_PAGE_TEXTS.checkoutPending}
          isCheckoutPending={checkoutMutation.isPending}
          onCheckout={(planId) => checkoutMutation.mutate(planId)}
          onPageChange={handlePlansPageChange}
        />

        {isAdmin ? (
          <CreditConsumeSection
            title={CREDITS_PAGE_TEXTS.consumeTitle}
            description={CREDITS_PAGE_TEXTS.consumeDescription}
            buttonLabel={CREDITS_PAGE_TEXTS.consumeButton}
            pendingLabel={CREDITS_PAGE_TEXTS.consumePending}
            isPending={consumeMutation.isPending}
            onConsume={() => consumeMutation.mutate()}
          />
        ) : null}

        <CreditHistorySection
          title={CREDITS_PAGE_TEXTS.historyTitle}
          entries={historyQuery.data?.data ?? []}
          meta={historyQuery.data?.meta}
          onPageChange={handleHistoryPageChange}
        />

        <CreditPurchasesSection
          title={CREDITS_PAGE_TEXTS.purchasesTitle}
          entries={purchasesQuery.data?.data ?? []}
          meta={purchasesQuery.data?.meta}
          onPageChange={handlePurchasePageChange}
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

function createPageChangeHandler(
  currentPage: number,
  setPage: (page: number) => void,
): (page: number) => void {
  return (nextPage: number) => {
    if (nextPage === currentPage) {
      return;
    }
    setPage(nextPage);
  };
}
