# Configuração

Templates de ambiente: `envexample.txt` (local, copiar para `.env`) e `docs/deploy/.envexampledeploy.txt` (produção/Railway). A validação em `validatePlatformConfig()` roda no boot e falha cedo se a combinação for inválida.

## Matriz de provedores

| Variável | Opções (padrão em negrito) | Efeito |
|---|---|---|
| `DATABASE_PROVIDER` | **postgres**, firestore, realtime | Prisma/PostgreSQL ou Firebase |
| `AUTH_MODE` (legado: `AUTH_PROVIDER`) | **local**, firebase, hybrid | Estratégia de autenticação |
| `MEDIA_STORAGE_PROVIDER` | **local**, firebase | Destino dos uploads |
| `PAYMENT_FLOW_MODE` | **rmq**, sync | Checkout assíncrono ou inline |
| `PAYMENT_PROVIDER` | **mock**, stripe | Gateway de pagamento |

## Runtime e logs

| Variável | Descrição |
|---|---|
| `APP_ENV` | `local` habilita pino-pretty e relaxa a validação de tamanho de segredos |
| `PORT` | Porta do backend (padrão 3001) |
| `BACKEND_BASE_URL` | Base usada para montar URLs públicas de upload |
| `LOG_LEVEL`, `APP_LOGGER_ENABLED` | Nível do pino e liga/desliga do `ApiLogger` |

## Autenticação e sessão

| Variável | Descrição |
|---|---|
| `JWT_SECRET`, `JWT_EXPIRATION` | Access token (padrão `1d`); mínimo 32 chars fora de `local` |
| `AUTH_JWE_SECRET`, `AUTH_JWE_EXPIRATION` | Refresh token JWE (padrão `7d`) |
| `CSRF_ENABLED` | Liga a checagem double-submit |
| `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE`, `AUTH_COOKIE_DOMAIN` | Atributos dos cookies (`samesite=none` exige `secure=true`) |
| `AUTH_ACCESS_COOKIE_MAX_AGE_MS`, `AUTH_REFRESH_COOKIE_MAX_AGE_MS` | Duração dos cookies |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin do seed; `ADMIN_EMAIL` também autoriza cadastro com papel ADMIN |

## Banco de dados e Firebase

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do Prisma |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Credenciais avulsas (`\n` é desescapado) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Alternativa: JSON bruto ou base64 |
| `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET` | Realtime DB e Storage |
| `FIREBASE_STORAGE_PUBLIC` | URL pública vs. URL assinada |
| `FIREBASE_AUTH_EMULATOR_HOST` | Emulador (somente local) |

## RabbitMQ e pagamentos

| Variável | Padrão | Descrição |
|---|---|---|
| `RABBITMQ_URL` | — | Conexão AMQP |
| `RABBITMQ_PAYMENT_QUEUE`, `RABBITMQ_PAYMENT_DLQ` | — | Fila principal e DLQ |
| `RABBITMQ_PREFETCH` | 25 | Prefetch do consumidor |
| `RABBITMQ_PUBLISH_TIMEOUT_MS` | 5000 | Timeout de publicação |
| `PAYMENT_MAX_RETRIES` | 3 | Tentativas do worker |
| `PAYMENT_OUTBOX_BATCH_SIZE` | 25 | Lote do dispatcher |
| `PAYMENT_OUTBOX_MAX_ATTEMPTS` | 5 | Tentativas do outbox |
| `PAYMENT_OUTBOX_DISPATCH_INTERVAL_MS` | 3000 | Intervalo do dispatcher |
| `PAYMENT_OUTBOX_RETRY_DELAY_MS` | 2000 | Base do backoff linear |
| `CREDIT_PAYMENT_MAX_RETRIES`, `CREDIT_OUTBOX_*` | — | Equivalentes para créditos |

## Stripe

| Variável | Descrição |
|---|---|
| `STRIPE_SECRET_KEY` | Obrigatória com `PAYMENT_PROVIDER=stripe` |
| `STRIPE_WEBHOOK_SECRET` | Validação de assinatura do webhook |
| `STRIPE_CURRENCY` | Padrão `brl` |
| `STRIPE_TEST_PAYMENT_METHOD` | Padrão `pm_card_visa` |

## CORS, CSP e rate limit

| Variável | Descrição |
|---|---|
| `CORS_ALLOWED_ORIGINS` | Lista de origens separadas por vírgula |
| `NEXT_PUBLIC_FRONTEND_URL` | Origem do frontend |
| `CSP_ENABLED`, `CSP_REPORT_ONLY`, `CSP_CONNECT_SRC` | Content-Security-Policy |
| `RATE_LIMIT_PERMITS` (150), `RATE_LIMIT_WINDOW_MINUTES` (1), `RATE_LIMIT_QUEUE` (5) | Throttling global |

## Uploads

| Variável | Padrão | Descrição |
|---|---|---|
| `UPLOADS_DIR` | — | Diretório servido em `/uploads/` |
| `UPLOAD_MAX_FILE_SIZE_MB` | 10 | Tamanho máximo |
| `UPLOAD_ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | Allowlist de MIME |

## Paginação

`PAGINATION_DEFAULT_PAGE` (1), `PAGINATION_DEFAULT_LIMIT` (12), `PAGINATION_MAX_LIMIT` (50).

## Frontend

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base da API (embutida no build do Docker) |
| `NEXT_PUBLIC_START_THEME`, `START_THEME` | Tema inicial (claro/escuro) |

## Validações de boot

O backend recusa iniciar quando: credenciais Firebase faltam com `DATABASE_PROVIDER` ≠ `postgres` ou `MEDIA_STORAGE_PROVIDER=firebase`; `STRIPE_SECRET_KEY` falta com `PAYMENT_PROVIDER=stripe`; `JWT_SECRET`/`AUTH_JWE_SECRET` têm menos de 32 caracteres fora de `APP_ENV=local`; ou `AUTH_COOKIE_SAMESITE=none` com `AUTH_COOKIE_SECURE=false` e CSRF ativo.

> Versão: 1.0.0
