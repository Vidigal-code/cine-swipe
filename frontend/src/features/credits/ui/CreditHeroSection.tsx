interface CreditHeroSectionProps {
  title: string;
  subtitle: string;
  currentBalanceLabel: string;
  balance: number;
  feedbackMessage?: string;
}

export function CreditHeroSection({
  title,
  subtitle,
  currentBalanceLabel,
  balance,
  feedbackMessage,
}: CreditHeroSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-center min-h-[9rem] flex flex-col justify-center">
      <h1 className="text-3xl font-bold text-card-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
      <p className="mt-3 text-lg font-semibold text-primary">
        {currentBalanceLabel}: {balance}
      </p>
      {feedbackMessage && <p className="mt-2 text-sm text-primary">{feedbackMessage}</p>}
    </section>
  );
}
