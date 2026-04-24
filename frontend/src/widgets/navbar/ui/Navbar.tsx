'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/shared/store/store';
import { logout } from '@/features/auth/model/authSlice';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button/Button';
import { ThemeToggle } from '@/features/theme/ui/ThemeToggle';
import { authApi } from '@/features/auth/api/auth.api';
import {
  getAuthenticatedMenuItems,
  getPublicMenuItems,
  NAVBAR_ROUTES,
  NAVBAR_TEXTS,
  type NavbarMenuItem,
} from '../model/navbar.constants';

const NAVBAR_STYLES = {
  shell:
    'w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  row: 'flex h-16 min-w-0 items-center justify-between gap-4',
  brand:
    'shrink-0 whitespace-nowrap text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400',
  desktopMenu:
    'hidden xl:flex min-w-0 flex-1 items-center justify-end gap-2',
  desktopMenuScroller:
    'min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
  desktopMenuTrack:
    'flex w-max min-w-full items-center justify-end gap-2 whitespace-nowrap pr-1',
  desktopLink:
    'inline-flex h-10 shrink-0 items-center rounded-lg border border-transparent px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200',
  desktopActionButton:
    'inline-flex h-10 shrink-0 items-center justify-center rounded-lg border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200',
  desktopActionPrimary:
    'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
  desktopActionOutline:
    'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
  mobileActions: 'xl:hidden flex items-center gap-2',
  mobileMenu: 'xl:hidden pb-4',
  mobileMenuList: 'flex flex-col items-center gap-3',
  mobileLink:
    'h-11 w-full max-w-xs rounded-lg border border-border bg-card text-card-foreground flex items-center justify-center text-center font-medium',
  menuToggle:
    'h-10 w-10 rounded-lg border border-border bg-card text-card-foreground flex items-center justify-center',
  active: 'bg-primary/10 text-primary border-primary/30',
  inactive: 'text-foreground hover:text-primary',
  logoutMobile:
    'h-11 w-full max-w-xs py-0 px-4 shadow-none font-normal text-center',
  registerMobileButton:
    'h-11 py-0 px-4 shadow-none font-normal text-center whitespace-nowrap',
} as const;

interface MenuLinksProps {
  items: NavbarMenuItem[];
  pathname: string;
  variant: 'desktop' | 'mobile';
}

function buildLinkClassName(
  href: string,
  pathname: string,
  variant: MenuLinksProps['variant'],
): string {
  const base =
    variant === 'desktop'
      ? NAVBAR_STYLES.desktopLink
      : NAVBAR_STYLES.mobileLink;

  const isActive = isRouteActive(pathname, href);
  const stateClass = isActive ? NAVBAR_STYLES.active : NAVBAR_STYLES.inactive;

  return `${base} ${stateClass}`;
}

function isRouteActive(pathname: string, href: string): boolean {
  if (href === NAVBAR_ROUTES.home) {
    return pathname === NAVBAR_ROUTES.home;
  }
  return pathname.startsWith(href);
}

function MenuLinks({ items, pathname, variant }: MenuLinksProps) {
  return items.map((item) => (
    <Link
      key={item.key}
      href={item.href}
      className={buildLinkClassName(item.href, pathname, variant)}
    >
      {item.label}
    </Link>
  ));
}

function buildDesktopActionClassName(variant: 'outline' | 'primary'): string {
  return `${NAVBAR_STYLES.desktopActionButton} ${
    variant === 'primary'
      ? NAVBAR_STYLES.desktopActionPrimary
      : NAVBAR_STYLES.desktopActionOutline
  }`;
}

export function Navbar() {
  const { isAuthenticated, user, isHydrated } = useSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const authenticatedItems = getAuthenticatedMenuItems(user?.role);
  const publicItems = getPublicMenuItems();
  const shouldShowAuthenticatedMenu = isHydrated && isAuthenticated;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch(logout());
      router.push(NAVBAR_ROUTES.home);
    }
  };

  return (
    <nav className={NAVBAR_STYLES.shell}>
      <div className={NAVBAR_STYLES.container}>
        <div className={NAVBAR_STYLES.row}>
          <Link href={NAVBAR_ROUTES.home} className={NAVBAR_STYLES.brand}>
            {NAVBAR_TEXTS.brand}
          </Link>

          <div className={NAVBAR_STYLES.desktopMenu}>
            <ThemeToggle />
            <div className={NAVBAR_STYLES.desktopMenuScroller}>
              <div className={NAVBAR_STYLES.desktopMenuTrack}>
                {shouldShowAuthenticatedMenu ? (
                  <>
                    <MenuLinks
                      items={authenticatedItems}
                      pathname={pathname}
                      variant="desktop"
                    />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={buildDesktopActionClassName('outline')}
                    >
                      {NAVBAR_TEXTS.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <MenuLinks
                      items={publicItems.filter(
                        (item) => item.href !== NAVBAR_ROUTES.register,
                      )}
                      pathname={pathname}
                      variant="desktop"
                    />
                    <Link
                      href={NAVBAR_ROUTES.register}
                      className={buildDesktopActionClassName('primary')}
                    >
                      {NAVBAR_TEXTS.register}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={NAVBAR_STYLES.mobileActions}>
            <ThemeToggle />
            <button
              type="button"
              aria-label={
                isMobileMenuOpen ? NAVBAR_TEXTS.closeMenu : NAVBAR_TEXTS.menu
              }
              className={NAVBAR_STYLES.menuToggle}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className={NAVBAR_STYLES.mobileMenu}>
            <div className={NAVBAR_STYLES.mobileMenuList}>
              {shouldShowAuthenticatedMenu ? (
                <>
                  <MenuLinks
                    items={authenticatedItems}
                    pathname={pathname}
                    variant="mobile"
                  />
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className={NAVBAR_STYLES.logoutMobile}
                  >
                    {NAVBAR_TEXTS.logout}
                  </Button>
                </>
              ) : (
                <>
                  <MenuLinks
                    items={publicItems.filter(
                      (item) => item.href !== NAVBAR_ROUTES.register,
                    )}
                    pathname={pathname}
                    variant="mobile"
                  />
                  <Link href={NAVBAR_ROUTES.register} className="w-full max-w-xs">
                    <Button className={NAVBAR_STYLES.registerMobileButton}>
                      {NAVBAR_TEXTS.register}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
