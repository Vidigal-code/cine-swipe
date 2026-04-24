'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../widgets/navbar/ui/Navbar';
import { movieApi } from '../../../features/movie/api/movie.api';
import { paymentApi } from '../../../features/payment/api/payment.api';
import { useSelector } from 'react-redux';
import { RootState } from '../../../shared/store/store';
import { Button } from '@/shared/ui/button/Button';
import { MovieTrailer } from '@/entities/movie/ui/MovieTrailer';

const MOVIE_DETAILS_TEXTS = {
  loading: 'Carregando...',
  notFound: 'Filme nao encontrado.',
  noImage: 'Sem Imagem',
  paymentError: 'Falha ao processar pagamento.',
  processing: 'Processando...',
  buyPrefix: 'Comprar por',
} as const;

const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatPrice(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

export default function MovieDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { isAuthenticated, isHydrated } = useSelector((state: RootState) => state.auth);

    const { data: movie, isLoading } = useQuery({
        queryKey: ['movie', params.id],
        queryFn: () => movieApi.getMovieById(params.id),
    });

    const checkoutMutation = useMutation({
        mutationFn: paymentApi.checkout,
        onSuccess: (checkoutResult) => {
            if (checkoutResult.status === 'FAILED') {
                alert(MOVIE_DETAILS_TEXTS.paymentError);
                return;
            }
            router.push('/my-movies?success=true');
        },
        onError: () => {
            alert(MOVIE_DETAILS_TEXTS.paymentError);
        }
    });

    const handleBuy = () => {
        if (!isHydrated) {
            return;
        }
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        checkoutMutation.mutate(params.id);
    };

    if (isLoading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">{MOVIE_DETAILS_TEXTS.loading}</div>;
    if (!movie) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">{MOVIE_DETAILS_TEXTS.notFound}</div>;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-10 mt-8">
                <div className="flex flex-col md:flex-row gap-8 bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-2xl">
                    <div className="w-full md:w-1/3 max-w-[21rem] mx-auto">
                        {movie.posterUrl ? (
                            <img src={movie.posterUrl} alt={movie.title} className="w-full rounded-xl shadow-lg" />
                        ) : (
                            <div className="w-full aspect-[2/3] bg-muted rounded-xl flex items-center justify-center">{MOVIE_DETAILS_TEXTS.noImage}</div>
                        )}
                    </div>

                    <div className="w-full md:w-2/3 flex flex-col text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold mb-4">{movie.title}</h1>
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-start mb-6">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/30">{movie.genre}</span>
                            <span className="text-muted-foreground">{formatPrice(Number(movie.price))}</span>
                        </div>

                        <p className="text-muted-foreground text-lg leading-relaxed mb-8 flex-grow">{movie.synopsis}</p>

                        {movie.trailerUrl && <MovieTrailer trailerUrl={movie.trailerUrl} />}

                        <Button
                            onClick={handleBuy}
                            isLoading={checkoutMutation.isPending}
                            className="mt-auto py-4 px-8 text-lg w-full sm:w-auto sm:max-w-sm self-center md:self-start"
                        >
                            {checkoutMutation.isPending
                              ? MOVIE_DETAILS_TEXTS.processing
                              : `${MOVIE_DETAILS_TEXTS.buyPrefix} ${formatPrice(Number(movie.price))}`}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
