import { forwardRef, InputHTMLAttributes, useId } from 'react';
import {
  buildCheckboxClassName,
  FORM_FIELD_CLASSES,
  joinClassNames,
} from '@/shared/ui/form-field/form-field.styles';

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  rowClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      containerClassName = '',
      rowClassName = '',
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;

    return (
      <div className={joinClassNames(FORM_FIELD_CLASSES.container, containerClassName)}>
        <div className={FORM_FIELD_CLASSES.actionSeparator}>
          <label
            htmlFor={resolvedId}
            className={joinClassNames(FORM_FIELD_CLASSES.checkboxRow, rowClassName)}
          >
            <input
              ref={ref}
              id={resolvedId}
              type="checkbox"
              aria-invalid={Boolean(error)}
              className={buildCheckboxClassName(Boolean(error))}
              {...props}
            />
            <span
              aria-hidden="true"
              className={joinClassNames(
                FORM_FIELD_CLASSES.checkboxIndicator,
                error
                  ? 'border-red-500 peer-focus-visible:ring-red-500'
                  : undefined,
              )}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="h-3.5 w-3.5 stroke-current stroke-[2.4]"
              >
                <path
                  d="M3 8.25L6.4 11.25L13 4.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {label && <span className={FORM_FIELD_CLASSES.checkboxLabel}>{label}</span>}
          </label>
        </div>
        {helperText && !error && (
          <p className={FORM_FIELD_CLASSES.helperText}>{helperText}</p>
        )}
        {error && <p className={FORM_FIELD_CLASSES.errorText}>{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
