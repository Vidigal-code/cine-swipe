'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/shared/store/store';
import { Navbar } from '@/widgets/navbar/ui/Navbar';
import { Button } from '@/shared/ui/button/Button';
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls';
import { useAdminAudit } from '@/features/admin-audit/model/useAdminAudit';
import { AdminAuditTable } from '@/features/admin-audit/ui/AdminAuditTable';

const AUDIT_PAGE_TEXTS = {
  title: 'Auditoria de Pagamentos',
  subtitle:
    'Visão administrativa com rastreabilidade completa do fluxo de checkout e confirmação.',
  backToAdmin: 'Voltar ao Painel',
};

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useSelector(
    (state: RootState) => state.auth,
  );

  const { query, items, meta } = useAdminAudit({
    enabled: Boolean(isHydrated && isAuthenticated && user?.role === 'ADMIN'),
    page,
    limit,
  });

  useEffect(() => {
    if (isHydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router, user]);

  if (!isHydrated || !isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex-1">
        <section className="rounded-2xl border border-border bg-card p-6 mb-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
                {AUDIT_PAGE_TEXTS.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
                {AUDIT_PAGE_TEXTS.subtitle}
              </p>
            </div>
            <Button
              variant="outline"
              className="h-11 py-0 px-4 w-full md:w-auto"
              onClick={() => router.push('/admin')}
            >
              {AUDIT_PAGE_TEXTS.backToAdmin}
            </Button>
          </div>
        </section>

        <AdminAuditTable audits={items} isLoading={query.isLoading} />

        {meta ? (
          <PaginationControls
            meta={meta}
            onPageChange={setPage}
            className="max-w-xl mx-auto"
          />
        ) : null}
      </main>
    </div>
  );
}
