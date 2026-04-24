interface ProfileHeaderSectionProps {
  title: string;
  subtitle: string;
  referralCodeLabel: string;
  referralCode?: string;
  missingReferralCode: string;
  feedbackMessage?: string;
}

export function ProfileHeaderSection({
  title,
  subtitle,
  referralCodeLabel,
  referralCode,
  missingReferralCode,
  feedbackMessage,
}: ProfileHeaderSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-center min-h-[9rem] flex flex-col justify-center">
      <h1 className="text-3xl font-bold text-card-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {referralCodeLabel}: {referralCode ?? missingReferralCode}
      </p>
      {feedbackMessage && <p className="mt-3 text-primary text-sm">{feedbackMessage}</p>}
    </section>
  );
}
