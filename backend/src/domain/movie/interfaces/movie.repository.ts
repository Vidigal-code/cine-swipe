import { Movie } from '../entities/movie.entity';

export const MOVIE_REPOSITORY = 'MOVIE_REPOSITORY';

export interface IMovieRepository {
    create(movie: Partial<Movie>): Promise<Movie>;
    findAll(): Promise<Movie[]>;
    findById(id: string): Promise<Movie | null>;
    update(id: string, movie: Partial<Movie>): Promise<Movie>;
    delete(id: string): Promise<void>;
}
