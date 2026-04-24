import {
  ChangeEvent,
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  buildControlClassName,
  FORM_FIELD_CLASSES,
  joinClassNames,
} from '@/shared/ui/form-field/form-field.styles';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      className = '',
      id,
      value,
      defaultValue,
      onChange,
      disabled,
      required,
      name,
      ...nativeProps
    },
    ref,
  ) => {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;
    const nativeId = `${resolvedId}-native`;
    const valueId = `${resolvedId}-value`;
    const listboxId = `${resolvedId}-listbox`;
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const internalSelectRef = useRef<HTMLSelectElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(() => {
      if (Array.isArray(defaultValue)) {
        return String(defaultValue[0] ?? '');
      }
      return defaultValue !== undefined && defaultValue !== null
        ? String(defaultValue)
        : '';
    });

    const isControlled = value !== undefined;
    const selectedValue = isControlled
      ? Array.isArray(value)
        ? String(value[0] ?? '')
        : String(value ?? '')
      : internalValue;

    const selectedOption = options.find((option) => option.value === selectedValue);
    const hasSelectedValue = selectedValue.length > 0;

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      function handleOutsideClick(event: MouseEvent): void {
        if (!wrapperRef.current) {
          return;
        }
        if (!wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      function handleEscape(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      }

      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen]);

    useEffect(() => {
      if (disabled) {
        setIsOpen(false);
      }
    }, [disabled]);

    function setSelectRef(node: HTMLSelectElement | null): void {
      internalSelectRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
        return;
      }
      if (ref) {
        ref.current = node;
      }
    }

    function updateSelectedValue(nextValue: string): void {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(
        {
          target: {
            value: nextValue,
            name: name ?? '',
          },
          currentTarget: {
            value: nextValue,
            name: name ?? '',
          },
        } as ChangeEvent<HTMLSelectElement>,
      );
    }

    function handleOptionSelect(nextValue: string): void {
      if (disabled) {
        return;
      }
      updateSelectedValue(nextValue);
      setIsOpen(false);
    }

    return (
      <div className={joinClassNames(FORM_FIELD_CLASSES.container, className)}>
        <label htmlFor={nativeId} className={FORM_FIELD_CLASSES.label}>
          {label}
        </label>
        <div className={FORM_FIELD_CLASSES.actionSeparator}>
          <div ref={wrapperRef} className={FORM_FIELD_CLASSES.selectWrapper}>
            <button
              type="button"
              id={resolvedId}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-labelledby={valueId}
              disabled={disabled}
              className={buildControlClassName(
                Boolean(error),
                FORM_FIELD_CLASSES.selectControlExtra,
                hasSelectedValue
                  ? FORM_FIELD_CLASSES.selectControlFilled
                  : FORM_FIELD_CLASSES.selectControlPlaceholder,
                'text-left',
              )}
              onClick={() => setIsOpen((current) => !current)}
            >
              <span id={valueId} className="block truncate pr-7">
                {selectedOption?.label ?? placeholder ?? 'Selecione'}
              </span>
            </button>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className={joinClassNames(
                FORM_FIELD_CLASSES.selectIcon,
                isOpen ? '-rotate-180 text-primary' : undefined,
              )}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {isOpen && (
              <div id={listboxId} role="listbox" className={FORM_FIELD_CLASSES.selectMenu}>
                {placeholder && !required && (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedValue === ''}
                    className={joinClassNames(
                      FORM_FIELD_CLASSES.selectMenuOption,
                      selectedValue === ''
                        ? FORM_FIELD_CLASSES.selectMenuOptionActive
                        : FORM_FIELD_CLASSES.selectMenuOptionIdle,
                    )}
                    onClick={() => handleOptionSelect('')}
                  >
                    {placeholder}
                  </button>
                )}
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selectedValue === option.value}
                    disabled={option.disabled}
                    className={joinClassNames(
                      FORM_FIELD_CLASSES.selectMenuOption,
                      option.disabled
                        ? FORM_FIELD_CLASSES.selectMenuOptionDisabled
                        : selectedValue === option.value
                          ? FORM_FIELD_CLASSES.selectMenuOptionActive
                          : FORM_FIELD_CLASSES.selectMenuOptionIdle,
                    )}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            <select
              ref={setSelectRef}
              id={nativeId}
              name={name}
              required={required}
              disabled={disabled}
              aria-invalid={Boolean(error)}
              value={selectedValue}
              onChange={onChange}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              {...nativeProps}
            >
              {placeholder && (
                <option value="" disabled={required}>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className={FORM_FIELD_CLASSES.errorText}>{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
