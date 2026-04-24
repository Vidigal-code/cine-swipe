interface AuthPageShellProps {
  children: React.ReactNode;
}

const AUTH_PAGE_SHELL_STYLES = {
  container:
    'min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-card p-4',
} as const;

export function AuthPageShell({ children }: AuthPageShellProps) {
  return <div className={AUTH_PAGE_SHELL_STYLES.container}>{children}</div>;
}
