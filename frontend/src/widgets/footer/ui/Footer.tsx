const FOOTER_TEXTS = {
  brand: 'CINE-SWIPE',
  mission: 'Catálogo de filmes com fluxo seguro de autenticação, mídia e pagamento.',
  support: 'Suporte: suporte@cine-swipe.local',
  rights: 'Todos os direitos reservados.',
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-center lg:text-left">
          <div className="space-y-1 w-full lg:w-auto flex flex-col items-center lg:items-start">
            <p className="font-bold text-base">{FOOTER_TEXTS.brand}</p>
            <p className="text-sm text-muted-foreground max-w-xl">
              {FOOTER_TEXTS.mission}
            </p>
          </div>
          <div className="space-y-1 w-full lg:w-auto flex flex-col items-center lg:items-start">
            <p className="text-sm text-muted-foreground">{FOOTER_TEXTS.support}</p>
            <p className="text-sm text-muted-foreground">
              {year} {FOOTER_TEXTS.brand} - {FOOTER_TEXTS.rights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
