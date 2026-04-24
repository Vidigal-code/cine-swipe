import { Movie } from '../entities/movie.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
export declare const MOVIE_REPOSITORY = "MOVIE_REPOSITORY";
export interface IMovieRepository {
    create(movie: Partial<Movie>): Promise<Movie>;
    findAll(): Promise<Movie[]>;
    findPage(params: PaginationParams): Promise<{
        items: Movie[];
        total: number;
    }>;
    findById(id: string): Promise<Movie | null>;
    update(id: string, movie: Partial<Movie>): Promise<Movie>;
    delete(id: string): Promise<void>;
}
