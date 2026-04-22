import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { MovieModule } from './movie.module';
import { AuthModule } from './auth.module';
import { PaymentModule } from './payment.module';

@Module({
  imports: [
    // Load .env from the project root if it exists, otherwise rely on process envs (like Docker)
    ConfigModule.forRoot({
      envFilePath: '../.env',
      isGlobal: true,
    }),
    DatabaseModule,
    MovieModule,
    AuthModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
