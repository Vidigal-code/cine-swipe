import Link from 'next/link';
import type { AuthNavigationItem } from '../model/auth-navigation.constants';

interface AuthFormFooterLinksProps {
  items: AuthNavigationItem[];
}

const FOOTER_LINK_STYLES = {
  container: 'mt-6 flex flex-col items-center gap-2',
  row: 'text-sm text-muted-foreground text-center',
  link: 'text-primary hover:text-primary/80 underline underline-offset-4',
} as const;

export function AuthFormFooterLinks({ items }: AuthFormFooterLinksProps) {
  return (
    <div className={FOOTER_LINK_STYLES.container}>
      {items.map((item) => (
        <p key={item.key} className={FOOTER_LINK_STYLES.row}>
          {item.prefix ? `${item.prefix} ` : ''}
          <Link href={item.href} className={FOOTER_LINK_STYLES.link}>
            {item.label}
          </Link>
        </p>
      ))}
    </div>
  );
}
