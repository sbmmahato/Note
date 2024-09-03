import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.log('🔴 Cannot find database url');
}

export default {
    dialect:'postgresql',
  schema: './src/lib/supabase/schema.ts',
  out: './migrations',
  dbCredentials: {
    url:process.env.DATABASE_URL || '',
    port:5432,
    database:'postgres',
    user:'postgres.mwavcmgrmkysvzinlfea',
    host:'aws-0-us-east-1.pooler.supabase.com',
    password:process.env.PW || ''
  }
} satisfies Config;