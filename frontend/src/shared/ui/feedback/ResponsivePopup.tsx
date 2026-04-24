'use client';

import { Button } from '@/shared/ui/button/Button';

type PopupVariant = 'info' | 'success' | 'warning' | 'error';

interface ResponsivePopupAction {
  label: string;
  onClick: () => void;
}

interface ResponsivePopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  closeLabel?: string;
  variant?: PopupVariant;
  action?: ResponsivePopupAction;
}

export function ResponsivePopup({
  isOpen,
  title,
  message,
  onClose,
  closeLabel = 'Fechar',
  variant = 'info',
  action,
}: ResponsivePopupProps) {
  if (!isOpen) {
    return null;
  }

  const variantStyles = resolveVariantStyles(variant);

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm p-4 flex items-center justify-center">
      <div
        className={`w-full max-w-md rounded-2xl border bg-card shadow-2xl p-5 sm:p-6 text-center ${variantStyles.container}`}
      >
        <h2 className={`text-xl font-bold ${variantStyles.title}`}>{title}</h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">{message}</p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          {action && (
            <Button
              className="w-full sm:w-auto sm:min-w-[10rem]"
              variant="outline"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          <Button
            className="w-full sm:w-auto sm:min-w-[10rem]"
            onClick={onClose}
          >
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function resolveVariantStyles(variant: PopupVariant): {
  container: string;
  title: string;
} {
  switch (variant) {
    case 'success':
      return {
        container: 'border-green-500/30',
        title: 'text-green-500',
      };
    case 'warning':
      return {
        container: 'border-amber-500/30',
        title: 'text-amber-500',
      };
    case 'error':
      return {
        container: 'border-red-500/30',
        title: 'text-red-500',
      };
    default:
      return {
        container: 'border-primary/30',
        title: 'text-primary',
      };
  }
}
