import Link from 'next/link';
import { Movie } from '../model/types';

const UI_TEXTS = {
    noImage: 'Sem Imagem',
    details: 'Detalhes',
};

export function MovieCard({ movie }: { movie: Movie }) {
    return (
        <div className="group relative w-full max-w-[21rem] sm:max-w-none h-[30rem] sm:h-full bg-card rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-border flex flex-col mx-auto">
            <div className="h-52 sm:h-60 md:h-64 lg:h-56 w-full overflow-hidden bg-background">
                {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/50">
                        {UI_TEXTS.noImage}
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow text-center sm:text-left">
                <h3 className="text-lg font-bold text-card-foreground mb-2 line-clamp-2 min-h-[3.5rem]">{movie.title}</h3>
                <p className="text-sm text-foreground/60 line-clamp-3 mb-4 flex-grow min-h-[4.5rem]">{movie.synopsis}</p>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-auto">
                    <span className="text-primary font-bold text-lg">R$ {Number(movie.price).toFixed(2)}</span>
                    <Link href={`/movie/${movie.id}`} className="h-10 px-4 inline-flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm rounded-lg transition-colors duration-200 w-full sm:w-auto">
                        {UI_TEXTS.details}
                    </Link>
                </div>
            </div>
        </div>
    );
}
