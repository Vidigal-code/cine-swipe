import { PaymentAudit } from '@/entities/payment-audit/model/types';
import { formatAuditDateTime } from '@/shared/lib/format-audit-datetime';
import { AuditDetailField } from './AuditDetailField';

const AUDIT_TEXTS = {
  empty: 'Nenhum registro de auditoria encontrado.',
  headers: [
    'Nome',
    'Filme',
    'Valor',
    'Status',
    'Evento',
    'Fonte',
    'Compra',
    'Provedor',
    'Correlação',
    'Stripe',
    'Data e Hora',
  ],
  labels: {
    purchaseId: 'ID da compra',
    provider: 'Provedor',
    correlationId: 'Correlação',
    stripeIntent: 'Payment Intent',
  },
};

interface AdminAuditTableProps {
  audits: PaymentAudit[];
  isLoading: boolean;
}

export function AdminAuditTable({ audits, isLoading }: AdminAuditTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-card-foreground">
        Carregando auditoria...
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
        {AUDIT_TEXTS.empty}
      </div>
    );
  }

  return (
    <>
      <div className="hidden xl:block rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-primary/10 text-card-foreground">
              {AUDIT_TEXTS.headers.map((header) => (
                <th key={header} className="p-3 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-card-foreground">
            {audits.map((audit) => (
              <tr
                key={audit.id}
                className="border-t border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <td className="p-3">
                  <p className="font-semibold">{audit.userName}</p>
                  <p className="text-xs text-muted-foreground">{audit.userEmail}</p>
                </td>
                <td className="p-3">
                  <p className="font-semibold">{audit.movieTitle}</p>
                  <p className="text-xs font-mono text-muted-foreground">{audit.movieId}</p>
                </td>
                <td className="p-3">R$ {Number(audit.amount).toFixed(2)}</td>
                <td className="p-3">
                  <span className="inline-flex px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {audit.status}
                  </span>
                </td>
                <td className="p-3 max-w-[10rem]">
                  <p className="font-semibold">{audit.eventType}</p>
                  {audit.message ? (
                    <p className="text-xs text-muted-foreground break-words">{audit.message}</p>
                  ) : null}
                </td>
                <td className="p-3">{audit.source}</td>
                <td className="p-3 font-mono text-xs">{audit.purchaseId}</td>
                <td className="p-3">{audit.provider}</td>
                <td className="p-3 font-mono text-xs">{audit.correlationId}</td>
                <td className="p-3 font-mono text-xs">
                  {audit.stripePaymentIntentId ?? '—'}
                </td>
                <td className="p-3 whitespace-nowrap">{formatAuditDateTime(audit.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="xl:hidden grid grid-cols-1 gap-4">
        {audits.map((audit) => (
          <article
            key={audit.id}
            className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center gap-3"
          >
            <h3 className="text-base font-bold">{audit.userName}</h3>
            <p className="text-sm text-muted-foreground">{audit.userEmail}</p>
            <p className="text-sm font-semibold">{audit.movieTitle}</p>
            <p className="text-sm text-muted-foreground">
              R$ {Number(audit.amount).toFixed(2)}
            </p>
            <p className="text-xs font-semibold text-primary">{audit.status}</p>
            <p className="text-xs text-muted-foreground">{audit.eventType}</p>
            <p className="text-xs text-muted-foreground">{audit.source}</p>
            <AuditDetailField
              label={AUDIT_TEXTS.labels.purchaseId}
              value={audit.purchaseId}
              monospace
            />
            <AuditDetailField label={AUDIT_TEXTS.labels.provider} value={audit.provider} />
            <AuditDetailField
              label={AUDIT_TEXTS.labels.correlationId}
              value={audit.correlationId}
              monospace
            />
            <AuditDetailField
              label={AUDIT_TEXTS.labels.stripeIntent}
              value={audit.stripePaymentIntentId}
              monospace
            />
            <p className="text-xs text-muted-foreground">
              {formatAuditDateTime(audit.createdAt)}
            </p>
            {audit.message ? (
              <p className="text-xs text-muted-foreground max-w-md">{audit.message}</p>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
