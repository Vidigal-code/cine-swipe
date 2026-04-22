import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { MovieService } from '../../application/movie/movie.service';
import { Movie } from '../../domain/movie/entities/movie.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';

@Controller('movies')
export class MovieController {
    constructor(private readonly movieService: MovieService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() movieData: Partial<Movie>): Promise<Movie> {
        return this.movieService.createMovie(movieData);
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
            }
        })
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        // Generate mocked URL
        const url = `${process.env.APP_ENV === 'local' ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' : 'https://real-domain.com'}/uploads/${file.filename}`;
        return { url };
    }

    @Get()
    async findAll(): Promise<Movie[]> {
        return this.movieService.getAllMovies();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Movie> {
        return this.movieService.getMovieById(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() movieData: Partial<Movie>): Promise<Movie> {
        return this.movieService.updateMovie(id, movieData);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string): Promise<void> {
        return this.movieService.deleteMovie(id);
    }
}
