# Self-Hosted Architecture - Treasure-Home School Management System

## Overview

This system is now **100% self-hosted** with **zero reliance on external services** like Supabase. All core functionality is provided through open-source, self-hosted components.

## Architecture Components

### 1. **Database: PostgreSQL**
- **Purpose**: Primary data storage
- **Technology**: PostgreSQL 16+ (can be self-hosted or use managed service)
- **ORM**: Drizzle ORM for type-safe database access
- **Migrations**: Automated migrations with Drizzle Kit
- **Backup**: Automated daily backups via `scripts/backup-database.sh`

### 2. **Object Storage: MinIO**
- **Purpose**: File storage (images, PDFs, documents)
- **Technology**: MinIO (S3-compatible object storage)
- **Buckets**:
  - `homepage-images` - Homepage content images
  - `gallery-images` - School gallery photos
  - `profile-images` - User profile pictures
  - `study-resources` - Educational materials
  - `general-uploads` - Miscellaneous files
- **Features**:
  - Public access for read operations
  - Secure signed URLs for uploads
  - Automatic bucket initialization
- **Backup**: Automated backups via `scripts/backup-minio.sh`

### 3. **Real-time Communication: Socket.IO**
- **Purpose**: Real-time data synchronization across clients
- **Technology**: Socket.IO (WebSocket + polling fallback)
- **Features**:
  - Table-based subscriptions
  - Automatic fallback to polling if WebSocket fails
  - Connection health monitoring
  - Event-driven architecture

### 4. **Backend: Express.js**
- **Framework**: Express.js with TypeScript
- **Features**:
  - JWT authentication
  - Role-based access control (RBAC)
  - RESTful API
  - Session management with PostgreSQL storage
  - Comprehensive error handling
  - Request logging and monitoring

### 5. **Frontend: React + Vite**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Real-time**: Socket.IO client

### 6. **Optional: Redis (Caching)**
- **Purpose**: Session storage, caching, rate limiting
- **Technology**: Redis 7+
- **Use Cases**:
  - Session storage (alternative to PostgreSQL)
  - Query result caching
  - Rate limiting for API endpoints

## Deployment Options

### Option 1: Local Development with Docker
```bash
# Start all services
./scripts/docker-start.sh

# Or manually
docker-compose up -d
```

Services will be available at:
- **Backend API**: http://localhost:5000
- **PostgreSQL**: postgresql://localhost:5432
- **MinIO API**: http://localhost:9000
- **MinIO Console**: http://localhost:9001
- **Redis**: redis://localhost:6379

### Option 2: Production Deployment

#### Components to Deploy:
1. **Backend Server** (Node.js)
   - Platform: Any VPS, AWS EC2, DigitalOcean Droplet, etc.
   - Requirements: Node.js 20+, 1GB+ RAM
   
2. **PostgreSQL Database**
   - Options: Self-hosted, AWS RDS, DigitalOcean Managed Database, etc.
   
3. **MinIO Storage**
   - Options: Self-hosted MinIO, AWS S3, DigitalOcean Spaces (S3-compatible)
   
4. **Frontend**
   - Options: Serve from backend, or deploy to Vercel/Netlify/Cloudflare

#### Environment Variables (Production):
```env
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# MinIO
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Optional: Redis
REDIS_URL=redis://redis.yourdomain.com:6379
```

## Data Flow

### File Upload Flow:
```
User → Frontend → Backend API → MinIO Storage
                       ↓
                  Database (metadata)
                       ↓
               Socket.IO (notify clients)
                       ↓
            All connected clients update
```

### Real-time Update Flow:
```
Database Change → Backend → Socket.IO → All Subscribed Clients
                                ↓
                          Query Invalidation
                                ↓
                          Auto-refetch Data
```

## Backup & Recovery

### Automated Backups:
- **Database**: Daily at 2 AM (configurable via `BACKUP_SCHEDULE`)
- **MinIO**: Daily backup of all object storage data
- **Retention**: 30 days (configurable via `BACKUP_RETENTION_DAYS`)

### Manual Backup:
```bash
# Backup database
./scripts/backup-database.sh

# Backup MinIO storage
./scripts/backup-minio.sh
```

### Restore:
```bash
# Restore database
./scripts/restore-database.sh ./backups/postgres/backup_YYYYMMDD_HHMMSS.sql.gz
```

## Security Features

1. **Authentication**: JWT-based with refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Password Security**: Bcrypt hashing with configurable rounds
4. **Session Management**: Secure session storage in PostgreSQL/Redis
5. **File Upload**: Type and size validation
6. **CORS**: Configurable allowed origins
7. **Rate Limiting**: Optional with Redis
8. **SQL Injection Protection**: Drizzle ORM parameterized queries
9. **XSS Protection**: Helmet.js middleware

## Monitoring & Logging

### Application Logs:
- Request/response logging with sanitized sensitive data
- Error logging with stack traces (development only)
- Performance monitoring (response times)

### Service Health:
- PostgreSQL: Connection pooling with health checks
- MinIO: Bucket availability monitoring
- Socket.IO: Connection health tracking

## Scalability

### Horizontal Scaling:
- Backend: Multiple instances behind load balancer
- Socket.IO: Redis adapter for multi-instance support
- Database: Read replicas for query performance

### Vertical Scaling:
- Increase server resources as needed
- Optimize database queries and indexes
- Implement caching layers (Redis)

## Migration from Supabase

If you're migrating from the previous Supabase-based setup:

1. **Data Migration**:
   - Export PostgreSQL data from Supabase
   - Import to your new PostgreSQL instance
   - Schema is compatible (uses Drizzle ORM)

2. **File Migration**:
   - Use `backend/scripts/migrate-supabase-to-minio.ts`
   - Downloads all files from Supabase Storage
   - Uploads to MinIO with same bucket structure

3. **Real-time Migration**:
   - Frontend automatically uses Socket.IO
   - No changes needed to subscription logic
   - Same query invalidation behavior

## Advantages of Self-Hosted Architecture

✅ **Complete Control**: Own your data and infrastructure
✅ **No Vendor Lock-in**: Switch providers easily
✅ **Cost Predictable**: Fixed hosting costs, no usage-based pricing
✅ **Privacy**: Data stays on your infrastructure
✅ **Customization**: Modify any component as needed
✅ **Compliance**: Meet data residency requirements
✅ **Offline Capable**: Can run entirely offline/on-premises

## Maintenance

### Regular Tasks:
- ✅ Monitor backup success
- ✅ Review application logs
- ✅ Update dependencies monthly
- ✅ Monitor disk space usage
- ✅ Review security logs

### Quarterly:
- ✅ Test disaster recovery procedures
- ✅ Review and optimize database queries
- ✅ Update system packages
- ✅ Security audit

## Support & Documentation

- **Setup Guide**: `docs/SETUP.md`
- **API Documentation**: `docs/API.md` (or Swagger at `/api/docs` in development)
- **Backup Guide**: `docs/BACKUP.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **Development Guide**: `README.md`

---

**Built with ❤️ for complete independence and control**
