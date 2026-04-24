import { User } from '../../user/entities/user.entity';
import { Movie } from '../../movie/entities/movie.entity';
export declare enum PurchaseStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class Purchase {
    id: string;
    user: User | null;
    userId: string;
    movie: Movie | null;
    movieId: string;
    amount: number;
    status: PurchaseStatus;
    provider: string;
    correlationId: string;
    stripePaymentIntentId: string | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
