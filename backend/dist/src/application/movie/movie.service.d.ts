import type { IMovieRepository } from '../../domain/movie/interfaces/movie.repository';
import { Movie } from '../../domain/movie/entities/movie.entity';
import { PaginationService } from '../../shared/pagination/pagination.service';
import { PaginatedResult, PaginationQueryInput } from '../../shared/pagination/pagination.types';
export declare class MovieService {
    private readonly movieRepository;
    private readonly paginationService;
    constructor(movieRepository: IMovieRepository, paginationService: PaginationService);
    createMovie(data: Partial<Movie>): Promise<Movie>;
    getAllMovies(): Promise<Movie[]>;
    getMoviesPage(paginationQuery: PaginationQueryInput): Promise<PaginatedResult<Movie>>;
    getMovieById(id: string): Promise<Movie>;
    updateMovie(id: string, data: Partial<Movie>): Promise<Movie>;
    deleteMovie(id: string): Promise<void>;
}
