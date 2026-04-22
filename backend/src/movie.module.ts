import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './domain/movie/entities/movie.entity';
import { MovieController } from './presentation/controllers/movie.controller';
import { MovieService } from './application/movie/movie.service';
import { TypeOrmMovieRepository } from './infrastructure/database/repositories/movie.repository';
import { MOVIE_REPOSITORY } from './domain/movie/interfaces/movie.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Movie])],
    controllers: [MovieController],
    providers: [
        MovieService,
        {
            provide: MOVIE_REPOSITORY,
            useClass: TypeOrmMovieRepository,
        },
    ],
    exports: [MovieService],
})
export class MovieModule { }
