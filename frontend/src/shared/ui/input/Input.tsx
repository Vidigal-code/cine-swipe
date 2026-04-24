import { InputHTMLAttributes, forwardRef } from 'react';
import {
  buildControlClassName,
  FORM_FIELD_CLASSES,
  joinClassNames,
} from '@/shared/ui/form-field/form-field.styles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className={joinClassNames(FORM_FIELD_CLASSES.container, className)}>
        <label htmlFor={id} className={FORM_FIELD_CLASSES.label}>
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={buildControlClassName(Boolean(error))}
          {...props}
        />
        {error && <p className={FORM_FIELD_CLASSES.errorText}>{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
