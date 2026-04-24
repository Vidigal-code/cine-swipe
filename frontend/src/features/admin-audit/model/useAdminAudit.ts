'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAuditApi } from '../api/adminAudit.api';

interface UseAdminAuditInput {
  enabled?: boolean;
  page: number;
  limit: number;
}

export function useAdminAudit({
  enabled = true,
  page,
  limit,
}: UseAdminAuditInput) {
  const query = useQuery({
    queryKey: ['admin_payment_audits', page, limit],
    queryFn: () => adminAuditApi.getPaymentAudits({ page, limit }),
    enabled,
  });

  return {
    query,
    items: query.data?.data ?? [],
    meta: query.data?.meta,
  };
}
