export const FORM_FIELD_CLASSES = {
  container: 'w-full',
  label: 'mb-1.5 block text-sm font-medium text-foreground',
  controlBase:
    'block w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60',
  actionSeparator: 'mb-2 border-b border-border pb-3',
  selectWrapper:
    'group relative after:pointer-events-none after:absolute after:bottom-0 after:left-4 after:right-11 after:h-px after:bg-primary/45 after:transition-colors after:duration-200 group-focus-within:after:bg-primary',
  selectControlExtra:
    'appearance-none cursor-pointer bg-gradient-to-b from-background to-muted pr-11 hover:border-primary hover:shadow-md',
  selectControlFilled: 'border-primary bg-card text-foreground',
  selectControlPlaceholder: 'text-muted-foreground',
  selectMenu:
    'absolute left-0 right-0 z-30 mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-xl',
  selectMenuOption:
    'w-full rounded-lg px-3 py-2 text-left text-sm text-card-foreground transition-colors duration-150',
  selectMenuOptionActive: 'bg-primary/15 text-primary',
  selectMenuOptionIdle: 'hover:bg-muted',
  selectMenuOptionDisabled:
    'cursor-not-allowed text-muted-foreground opacity-60 hover:bg-transparent',
  selectIcon:
    'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-all duration-200 group-focus-within:-rotate-180 group-focus-within:text-primary',
  checkboxControl: 'peer sr-only',
  checkboxIndicator:
    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-background text-transparent shadow-sm transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
  checkboxRow:
    'group inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-foreground',
  checkboxLabel: 'leading-none',
  helperText: 'mt-1.5 text-xs text-muted-foreground',
  errorText: 'mt-1.5 text-sm text-red-500',
  fileControlExtra:
    'file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary file:transition-colors hover:file:bg-primary/20',
} as const;

export function buildControlClassName(
  hasError: boolean,
  ...extraClasses: Array<string | undefined>
): string {
  return joinClassNames(
    FORM_FIELD_CLASSES.controlBase,
    hasError
      ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
      : 'border-border',
    ...extraClasses,
  );
}

export function buildCheckboxClassName(
  _hasError: boolean,
  ...extraClasses: Array<string | undefined>
): string {
  return joinClassNames(
    FORM_FIELD_CLASSES.checkboxControl,
    ...extraClasses,
  );
}

export function joinClassNames(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}
