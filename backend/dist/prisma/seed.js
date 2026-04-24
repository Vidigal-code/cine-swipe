"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const PASSWORD_SALT_ROUNDS = 10;
const CREDIT_SYSTEM_CONFIG_ID = 1;
const REFERRAL_CODE_HASH_LENGTH = 12;
function getAdminSeedConfig() {
    const username = process.env.ADMIN_USERNAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!username || !email || !password) {
        throw new Error('Missing ADMIN_USERNAME, ADMIN_EMAIL or ADMIN_PASSWORD');
    }
    return { username, email, password };
}
async function upsertAdmin() {
    const { username, email, password } = getAdminSeedConfig();
    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const registrationBonusCredits = await resolveRegistrationBonusCredits();
    await prisma.user.upsert({
        where: { email },
        update: {
            username,
            role: client_1.UserRole.ADMIN,
            passwordHash,
            referralCode: buildReferralCode(email),
            creditsBalance: registrationBonusCredits,
        },
        create: {
            username,
            email,
            role: client_1.UserRole.ADMIN,
            passwordHash,
            referralCode: buildReferralCode(email),
            creditsBalance: registrationBonusCredits,
        },
    });
}
function buildMovieSeeds() {
    return [
        {
            id: '0f9b80fd-6524-47cd-a98f-6e7d3b3f15f1',
            title: 'Aventura em Curitiba',
            synopsis: 'Dois amigos enfrentam uma série de desafios urbanos para salvar um cinema de bairro.',
            genre: 'Aventura',
            price: 19.9,
            posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80',
            trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        {
            id: '16c93fd9-11c0-4cc4-81a0-e038b7b31296',
            title: 'Noite no Rio',
            synopsis: 'Uma jornalista investiga um caso misterioso durante uma noite intensa no Rio de Janeiro.',
            genre: 'Suspense',
            price: 24.5,
            posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80',
            trailerUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        },
        {
            id: '7b80d03a-66f8-46a7-b430-8fb8f3d85d9f',
            title: 'Sol de Recife',
            synopsis: 'Uma comedia romantica sobre reencontros, musica e segundas chances no litoral pernambucano.',
            genre: 'Romance',
            price: 17.75,
            posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80',
            trailerUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
        },
        {
            id: '1beaf99e-6e2f-462f-a7eb-b0fdf96d2c14',
            title: 'Fronteira de Sao Paulo',
            synopsis: 'Um policial e uma programadora unem forcas para impedir um ataque cibernetico em massa.',
            genre: 'Acao',
            price: 29.0,
            posterUrl: 'https://images.unsplash.com/photo-1460881680858-30d872d5b530?auto=format&fit=crop&w=900&q=80',
            trailerUrl: 'https://www.youtube.com/watch?v=5PSNL1qE6VY',
        },
    ];
}
async function upsertMovies() {
    const movies = buildMovieSeeds();
    await Promise.all(movies.map((movie) => prisma.movie.upsert({
        where: { id: movie.id },
        update: {
            title: movie.title,
            synopsis: movie.synopsis,
            genre: movie.genre,
            price: movie.price,
            posterUrl: movie.posterUrl,
            trailerUrl: movie.trailerUrl,
        },
        create: {
            id: movie.id,
            title: movie.title,
            synopsis: movie.synopsis,
            genre: movie.genre,
            price: movie.price,
            posterUrl: movie.posterUrl,
            trailerUrl: movie.trailerUrl,
        },
    })));
}
function buildCreditPlanSeeds() {
    return [
        {
            id: '1b1f5d20-cf74-4af0-b14b-6f5a65d6f111',
            name: 'Plano Bronze',
            creditsAmount: 300,
            priceBrl: 19.9,
            isActive: true,
        },
        {
            id: '8a2364be-0b20-4dd6-8c88-089329d85732',
            name: 'Plano Prata',
            creditsAmount: 800,
            priceBrl: 44.9,
            isActive: true,
        },
        {
            id: '77a5fdb6-64f0-4907-ac13-12f0fc8119d4',
            name: 'Plano Ouro',
            creditsAmount: 1800,
            priceBrl: 89.9,
            isActive: true,
        },
    ];
}
async function upsertCreditSystemConfig() {
    await prisma.creditSystemConfig.upsert({
        where: { id: CREDIT_SYSTEM_CONFIG_ID },
        update: {
            registrationBonusCredits: 250,
            referralEnabled: true,
            refereeRegistrationBonusCredits: 50,
            referrerFirstPurchaseBonusCredits: 100,
        },
        create: {
            id: CREDIT_SYSTEM_CONFIG_ID,
            registrationBonusCredits: 250,
            referralEnabled: true,
            refereeRegistrationBonusCredits: 50,
            referrerFirstPurchaseBonusCredits: 100,
        },
    });
}
async function upsertCreditPlans() {
    const plans = buildCreditPlanSeeds();
    await Promise.all(plans.map((plan) => prisma.creditPlan.upsert({
        where: { name: plan.name },
        update: {
            creditsAmount: plan.creditsAmount,
            priceBrl: plan.priceBrl,
            isActive: plan.isActive,
        },
        create: {
            id: plan.id,
            name: plan.name,
            creditsAmount: plan.creditsAmount,
            priceBrl: plan.priceBrl,
            isActive: plan.isActive,
        },
    })));
}
async function resolveRegistrationBonusCredits() {
    const config = await prisma.creditSystemConfig.findUnique({
        where: { id: CREDIT_SYSTEM_CONFIG_ID },
    });
    return config?.registrationBonusCredits ?? 250;
}
function buildReferralCode(email) {
    const normalized = email.trim().toLowerCase();
    const encoded = Buffer.from(normalized).toString('base64url');
    const hash = encoded.replace(/[^a-zA-Z0-9]/g, '').slice(0, REFERRAL_CODE_HASH_LENGTH);
    return `ref_${hash || 'default'}`;
}
async function main() {
    await upsertCreditSystemConfig();
    await upsertCreditPlans();
    await upsertAdmin();
    await upsertMovies();
}
main()
    .catch((error) => {
    console.error('Prisma seed failed', error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map