import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7 configuration.
 *
 * In Prisma 7 the datasource URL is no longer declared in `schema.prisma`
 * (that field was removed). The schema now only declares `provider` +
 * optional generator config; the URL lives here and is read from
 * `DATABASE_URL` at CLI time. The `PrismaClient` constructor picks it up
 * via the same `DATABASE_URL` env var, so no adapter wiring is needed for
 * direct Postgres connections.
 */
export default defineConfig({
  schema: 'libs/backend/infra/database/src/prisma/schema',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'libs/backend/infra/database/src/prisma/migrations',
  },
});
