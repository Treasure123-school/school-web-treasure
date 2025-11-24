import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../shared/schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        
        if (!connectionString) {
          throw new Error('DATABASE_URL is not defined');
        }

        const client = postgres(connectionString, {
          ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });

        const db = drizzle(client, { schema });

        console.log('✅ Database connection established');
        
        return db;
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
