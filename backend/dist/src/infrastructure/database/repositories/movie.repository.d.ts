import { IMovieRepository } from '../../../domain/movie/interfaces/movie.repository';
import { Movie } from '../../../domain/movie/entities/movie.entity';
import { PrismaService } from '../prisma.service';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
export declare class PrismaMovieRepository implements IMovieRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(movie: Partial<Movie>): Promise<Movie>;
    findAll(): Promise<Movie[]>;
    findPage(params: PaginationParams): Promise<{
        items: Movie[];
        total: number;
    }>;
    findById(id: string): Promise<Movie | null>;
    update(id: string, movie: Partial<Movie>): Promise<Movie>;
    delete(id: string): Promise<void>;
    private buildCreateData;
    private buildUpdateData;
    private toDomainList;
    private toDomain;
}
