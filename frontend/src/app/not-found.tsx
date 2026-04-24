import Link from 'next/link';
import { Navbar } from '@/widgets/navbar/ui/Navbar';
import { Button } from '@/shared/ui/button/Button';

export default function GlobalNotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-4xl items-center justify-center px-4 py-16">
        <section className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-lg sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Erro 404
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Pagina nao encontrada
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            O link acessado nao existe ou foi movido. Use um dos atalhos abaixo
            para continuar navegando.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button className="sm:w-auto sm:px-8">Ir para inicio</Button>
            </Link>
            <Link href="/credits">
              <Button variant="outline" className="sm:w-auto sm:px-8">
                Ver planos
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
