interface AuditDetailFieldProps {
  label: string;
  value: string | null | undefined;
  monospace?: boolean;
}

export function AuditDetailField({
  label,
  value,
  monospace = false,
}: AuditDetailFieldProps) {
  const display = value && String(value).trim() !== '' ? String(value) : '—';

  return (
    <div className="w-full max-w-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-sm break-all ${monospace ? 'font-mono text-xs' : ''}`}
        title={display}
      >
        {display}
      </p>
    </div>
  );
}
