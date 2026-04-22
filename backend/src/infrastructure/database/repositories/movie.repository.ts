import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMovieRepository } from '../../../domain/movie/interfaces/movie.repository';
import { Movie } from '../../../domain/movie/entities/movie.entity';

@Injectable()
export class TypeOrmMovieRepository implements IMovieRepository {
    constructor(
        @InjectRepository(Movie)
        private readonly repository: Repository<Movie>,
    ) { }

    async create(movie: Partial<Movie>): Promise<Movie> {
        const newMovie = this.repository.create(movie);
        return this.repository.save(newMovie);
    }

    async findAll(): Promise<Movie[]> {
        return this.repository.find({ order: { createdAt: 'DESC' } });
    }

    async findById(id: string): Promise<Movie | null> {
        return this.repository.findOne({ where: { id } });
    }

    async update(id: string, movie: Partial<Movie>): Promise<Movie> {
        await this.repository.update(id, movie);
        return this.repository.findOne({ where: { id } }) as Promise<Movie>;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
