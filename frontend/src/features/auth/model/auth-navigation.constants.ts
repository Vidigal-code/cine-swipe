export interface AuthNavigationItem {
  key: string;
  href: string;
  label: string;
  prefix?: string;
}

export const AUTH_NAVIGATION_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
} as const;

export const LOGIN_PAGE_NAVIGATION_ITEMS: AuthNavigationItem[] = [
  {
    key: 'login-to-register',
    href: AUTH_NAVIGATION_ROUTES.register,
    label: 'Criar conta',
    prefix: 'Nao possui conta?',
  },
  {
    key: 'login-to-home',
    href: AUTH_NAVIGATION_ROUTES.home,
    label: 'Voltar para inicio',
  },
];

export const REGISTER_PAGE_NAVIGATION_ITEMS: AuthNavigationItem[] = [
  {
    key: 'register-to-login',
    href: AUTH_NAVIGATION_ROUTES.login,
    label: 'Fazer login',
    prefix: 'Ja possui conta?',
  },
];
