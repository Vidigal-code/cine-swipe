import { InputHTMLAttributes, forwardRef } from 'react';
import {
  buildControlClassName,
  FORM_FIELD_CLASSES,
  joinClassNames,
} from '@/shared/ui/form-field/form-field.styles';

interface FileInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    return (
      <div className={joinClassNames(FORM_FIELD_CLASSES.container, className)}>
        <label htmlFor={id} className={FORM_FIELD_CLASSES.label}>
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          type="file"
          className={buildControlClassName(
            Boolean(error),
            FORM_FIELD_CLASSES.fileControlExtra,
          )}
          {...props}
        />
        {helperText && !error && (
          <p className={FORM_FIELD_CLASSES.helperText}>{helperText}</p>
        )}
        {error && <p className={FORM_FIELD_CLASSES.errorText}>{error}</p>}
      </div>
    );
  },
);

FileInput.displayName = 'FileInput';
