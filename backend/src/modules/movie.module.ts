import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MovieController } from '../presentation/controllers/movie.controller';
import { MovieService } from '../application/movie/movie.service';
import { PrismaMovieRepository } from '../infrastructure/database/repositories/movie.repository';
import { MOVIE_REPOSITORY } from '../domain/movie/interfaces/movie.repository';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { SharedModule } from '../shared/shared.module';
import { ResponseModule } from '../shared/http-response/response.module';

@Module({
  imports: [DatabaseModule, SharedModule, ResponseModule, JwtModule],
  controllers: [MovieController],
  providers: [
    MovieService,
    JwtAuthGuard,
    {
      provide: MOVIE_REPOSITORY,
      useClass: PrismaMovieRepository,
    },
  ],
  exports: [MovieService],
})
export class MovieModule {}
