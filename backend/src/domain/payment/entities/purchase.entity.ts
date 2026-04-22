import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Movie } from '../../movie/entities/movie.entity';

export enum PurchaseStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Entity('purchases')
export class Purchase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Movie)
    @JoinColumn({ name: 'movieId' })
    movie: Movie;

    @Column()
    movieId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.PENDING })
    status: PurchaseStatus;

    @CreateDateColumn()
    createdAt: Date;
}
