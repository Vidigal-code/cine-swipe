export const NAVBAR_TEXTS = {
  brand: 'CINE-SWIPE',
  adminDashboard: 'Painel',
  adminAudit: 'Auditoria',
  adminCredits: 'Creditos Admin',
  adminUsers: 'Usuarios Admin',
  credits: 'Creditos',
  profile: 'Perfil',
  myMovies: 'Meus Filmes',
  logout: 'Sair',
  login: 'Entrar',
  register: 'Criar Conta',
  menu: 'Menu',
  closeMenu: 'Fechar menu',
} as const;

export const NAVBAR_ROUTES = {
  home: '/',
  adminDashboard: '/admin',
  adminAudit: '/admin/audit',
  adminCredits: '/admin/credits',
  adminUsers: '/admin/users',
  credits: '/credits',
  profile: '/profile',
  myMovies: '/my-movies',
  login: '/login',
  register: '/register',
} as const;

export interface NavbarMenuItem {
  key: string;
  href: string;
  label: string;
}

type UserRole = 'ADMIN' | 'USER' | undefined;

export function getAuthenticatedMenuItems(role: UserRole): NavbarMenuItem[] {
  const items: NavbarMenuItem[] = [];

  if (role === 'ADMIN') {
    items.push(
      {
        key: 'admin-dashboard',
        href: NAVBAR_ROUTES.adminDashboard,
        label: NAVBAR_TEXTS.adminDashboard,
      },
      {
        key: 'admin-audit',
        href: NAVBAR_ROUTES.adminAudit,
        label: NAVBAR_TEXTS.adminAudit,
      },
      {
        key: 'admin-credits',
        href: NAVBAR_ROUTES.adminCredits,
        label: NAVBAR_TEXTS.adminCredits,
      },
      {
        key: 'admin-users',
        href: NAVBAR_ROUTES.adminUsers,
        label: NAVBAR_TEXTS.adminUsers,
      },
    );
  }

  items.push(
    {
      key: 'credits',
      href: NAVBAR_ROUTES.credits,
      label: NAVBAR_TEXTS.credits,
    },
    {
      key: 'profile',
      href: NAVBAR_ROUTES.profile,
      label: NAVBAR_TEXTS.profile,
    },
  );

  items.push({
    key: 'my-movies',
    href: NAVBAR_ROUTES.myMovies,
    label: NAVBAR_TEXTS.myMovies,
  });

  return items;
}

export function getPublicMenuItems(): NavbarMenuItem[] {
  return [
    {
      key: 'login',
      href: NAVBAR_ROUTES.login,
      label: NAVBAR_TEXTS.login,
    },
    {
      key: 'register',
      href: NAVBAR_ROUTES.register,
      label: NAVBAR_TEXTS.register,
    },
  ];
}
