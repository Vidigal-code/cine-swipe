import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MovieController } from '../presentation/controllers/movie.controller';
import { MovieService } from '../application/movie/movie.service';
import { PrismaMovieRepository } from '../infrastructure/database/repositories/movie.repository';
import { MOVIE_REPOSITORY } from '../domain/movie/interfaces/movie.repository';
import type { IMovieRepository } from '../domain/movie/interfaces/movie.repository';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { SharedModule } from '../shared/shared.module';
import { ResponseModule } from '../shared/http-response/response.module';
import { FirebaseMovieRepository } from '../infrastructure/firebase/repositories/firebase-movie.repository';
import { pickDatabaseRepository } from '../infrastructure/database/repository-provider.factory';

@Module({
  imports: [DatabaseModule, SharedModule, ResponseModule, JwtModule],
  controllers: [MovieController],
  providers: [
    MovieService,
    JwtAuthGuard,
    PrismaMovieRepository,
    FirebaseMovieRepository,
    {
      provide: MOVIE_REPOSITORY,
      inject: [ConfigService, PrismaMovieRepository, FirebaseMovieRepository],
      useFactory: (
        configService: ConfigService,
        prismaRepository: PrismaMovieRepository,
        firebaseRepository: FirebaseMovieRepository,
      ): IMovieRepository =>
        pickDatabaseRepository<IMovieRepository>(configService, {
          postgres: prismaRepository,
          firebase: firebaseRepository,
        }),
    },
  ],
  exports: [MovieService],
})
export class MovieModule {}
