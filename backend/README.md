# Treasure-Home School Management - Self-Hosted Backend

Enterprise-grade, self-hosted backend for school management system with zero external dependencies.

## Features

- ✅ **Self-Hosted**: Complete independence from third-party services
- ✅ **NestJS**: Enterprise-grade modular architecture
- ✅ **MinIO**: S3-compatible object storage
- ✅ **WebSocket**: Real-time notifications and chat
- ✅ **JWT Auth**: Secure token-based authentication
- ✅ **RBAC**: Role-based access control
- ✅ **Docker**: Full containerization
- ✅ **Automated Backups**: Database and storage backups
- ✅ **Audit Logs**: Complete activity tracking
- ✅ **API Docs**: OpenAPI/Swagger documentation

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start Docker services (PostgreSQL + MinIO)
docker-compose -f docker/docker-compose.yml up -d

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run start:dev
```

Server runs at: `http://localhost:3000`
API docs at: `http://localhost:3000/api/docs`

### Production

```bash
# Build and start all services
docker-compose -f docker/docker-compose.prod.yml up -d

# View logs
docker-compose -f docker/docker-compose.prod.yml logs -f backend
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/treasurehome

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Server
PORT=3000
NODE_ENV=development
```

## Project Structure

```
backend/
├── src/
│   ├── modules/          # Business modules
│   │   ├── auth/        # Authentication
│   │   ├── users/       # User management
│   │   ├── students/    # Student management
│   │   ├── teachers/    # Teacher management
│   │   └── ...
│   ├── common/          # Shared code
│   ├── config/          # Configuration
│   ├── database/        # Database & migrations
│   ├── infrastructure/  # External services
│   │   ├── storage/    # MinIO integration
│   │   ├── email/      # Email service
│   │   └── logging/    # Logging system
│   ├── app.module.ts   # Root module
│   └── main.ts         # Entry point
├── test/               # Tests
├── docker/             # Docker configs
├── scripts/            # Utility scripts
└── docs/               # Documentation
```

## API Documentation

Swagger UI available at `/api/docs` in development mode.

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Backup & Restore

### Manual Backup

```bash
# Database
./scripts/backup-database.sh

# Storage
./scripts/backup-storage.sh
```

### Automated Backups

Configured in `docker-compose.prod.yml` to run daily at 2 AM.

## Migration from Supabase

See `docs/SELF_HOSTED_MIGRATION_PLAN.md` for complete migration guide.

## License

MIT
