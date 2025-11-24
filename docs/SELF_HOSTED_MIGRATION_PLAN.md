# Self-Hosted Backend Migration Plan
## Treasure-Home School Management System

### Migration Overview
Complete migration from Supabase-dependent architecture to fully self-hosted enterprise backend.

---

## Current Dependencies (TO REMOVE)

### Supabase Storage
- **Usage**: File uploads (images, PDFs, documents)
- **Buckets**: homepage-images, gallery-images, profile-images, study-resources, general-uploads
- **Files Using**: 
  - `server/supabase-storage.ts`
  - `server/routes.ts` (upload endpoints)
  - `client/src/pages/portal/*` (file upload components)

### Supabase Realtime
- **Usage**: Live data synchronization
- **Tables**: announcements, classes, subjects, users, students, exams, attendance, academic_terms
- **Files Using**:
  - `client/src/lib/supabase.ts`
  - `client/src/hooks/useSupabaseRealtime.ts`
  - `client/src/hooks/useGlobalRealtime.tsx`
  - `client/src/components/RealtimeHealthMonitor.tsx`

### Environment Variables (TO REMOVE)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## New Self-Hosted Architecture

### Technology Stack Decision
**Backend Framework**: **NestJS** (chosen for enterprise features)
- Built-in dependency injection
- Modular architecture
- Excellent TypeScript support
- Built-in validation pipes
- Strong testing framework
- OpenAPI/Swagger integration
- WebSocket support out of the box

### Infrastructure Components

#### 1. **MinIO** (S3-Compatible Storage)
- Self-hosted object storage
- S3-compatible API
- Bucket policies
- Signed URLs for secure access
- Docker deployment

#### 2. **WebSocket Server** (Socket.IO with NestJS)
- Real-time notifications
- Live chat
- Presence tracking
- Room-based subscriptions
- Auto-reconnection

#### 3. **JWT Authentication**
- Access tokens (15min expiry)
- Refresh tokens (7 days expiry)
- Secure password hashing (bcrypt)
- Token rotation
- Blacklist for logout

#### 4. **PostgreSQL** (Existing)
- Keep current Drizzle ORM
- Add migration system
- Seed scripts

#### 5. **Docker Infrastructure**
- PostgreSQL container
- MinIO container
- NestJS backend container
- Redis for sessions/cache (optional)

---

## New Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── storage.config.ts
│   │   ├── jwt.config.ts
│   │   └── websocket.config.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   └── strategies/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── parents/
│   │   ├── classes/
│   │   ├── results/
│   │   ├── attendance/
│   │   ├── payments/
│   │   ├── notifications/
│   │   ├── files/
│   │   ├── realtime/
│   │   └── audit/
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── utils/
│   │   └── constants/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── infrastructure/
│   │   ├── storage/
│   │   │   ├── minio.service.ts
│   │   │   └── storage.interface.ts
│   │   ├── email/
│   │   ├── logging/
│   │   └── security/
│   ├── main.ts
│   └── app.module.ts
├── test/
│   ├── unit/
│   └── integration/
├── scripts/
│   ├── backup-database.sh
│   ├── backup-storage.sh
│   └── restore.sh
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   └── BACKUP_RESTORE.md
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## Migration Steps (Detailed)

### Phase 1: Infrastructure Setup
1. Install NestJS CLI and dependencies
2. Create Docker Compose with PostgreSQL + MinIO
3. Set up MinIO buckets
4. Configure environment variables

### Phase 2: Core Modules
1. Database module (Drizzle integration)
2. Config module
3. Auth module (JWT + refresh tokens)
4. Users module (RBAC)
5. Roles module

### Phase 3: Storage Layer
1. MinIO service implementation
2. File upload endpoints
3. Signed URL generation
4. Migration script for existing files

### Phase 4: Real-time Layer
1. WebSocket gateway
2. Notification service
3. Real-time events
4. Chat module

### Phase 5: School Modules
1. Students module
2. Teachers module
3. Parents module
4. Classes module
5. Subjects module
6. Attendance module
7. Results/Grades module
8. Exams module
9. Payments module

### Phase 6: Operational Features
1. Audit logging
2. Error logging
3. Activity tracking
4. Automated backups
5. Email service

### Phase 7: Testing & Documentation
1. Unit tests
2. Integration tests
3. API documentation (Swagger)
4. Deployment guides
5. Backup/restore guides

### Phase 8: Clean Up
1. Remove Supabase packages
2. Remove Supabase files
3. Update environment variables
4. Remove dead code
5. Final validation

---

## Environment Variables (New)

### Required
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/treasurehome

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Backup
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
```

---

## Data Migration Strategy

### Files (Supabase Storage → MinIO)
1. Export all files from Supabase buckets
2. Upload to MinIO buckets
3. Update database URLs
4. Verify all files accessible

### Database (No change needed)
- Keep existing PostgreSQL
- Keep Drizzle ORM
- Keep existing schemas

### Real-time (Supabase → WebSocket)
1. Replace Supabase client with Socket.IO client
2. Update frontend hooks
3. Implement WebSocket events
4. Add fallback polling

---

## Security Enhancements

### Authentication
- JWT with short-lived access tokens
- Secure refresh token rotation
- Password reset via email
- Account lockout after failed attempts
- MFA support (optional)

### Storage
- Signed URLs with expiration
- Bucket policies
- File size limits
- MIME type validation
- Virus scanning (optional)

### API
- Rate limiting
- CORS configuration
- Helmet security headers
- Request validation
- SQL injection prevention

### Logging
- All authentication attempts
- File operations
- Critical data changes
- Admin actions
- Failed requests

---

## Backup Strategy

### Database Backups
- Automated daily backups
- pg_dump format
- Compressed storage
- 30-day retention
- S3/MinIO upload

### Storage Backups
- MinIO bucket snapshots
- Incremental backups
- Versioning enabled
- Cross-region replication (optional)

### Restore Testing
- Monthly restore tests
- Documentation
- Recovery time objectives

---

## Rollback Plan

If issues arise during migration:
1. Keep Supabase credentials active during transition
2. Maintain dual-write capability
3. Feature flags for new vs old system
4. Gradual rollout by user role
5. Quick rollback script

---

## Success Criteria

### Functional Requirements
- ✅ All file uploads work via MinIO
- ✅ All real-time features work via WebSocket
- ✅ JWT authentication fully functional
- ✅ All RBAC permissions enforced
- ✅ Automated backups running
- ✅ All existing features maintained

### Non-Functional Requirements
- ✅ API response time < 200ms (p95)
- ✅ File upload < 5s for 10MB
- ✅ WebSocket latency < 100ms
- ✅ 99.9% uptime
- ✅ Zero data loss

### Documentation
- ✅ Setup guide complete
- ✅ API documentation (Swagger)
- ✅ Deployment guide
- ✅ Backup/restore guide
- ✅ Troubleshooting guide

---

## Timeline Estimate

- Phase 1 (Infrastructure): 2 hours
- Phase 2 (Core Modules): 4 hours
- Phase 3 (Storage Layer): 3 hours
- Phase 4 (Real-time Layer): 3 hours
- Phase 5 (School Modules): 6 hours
- Phase 6 (Operational): 3 hours
- Phase 7 (Testing & Docs): 4 hours
- Phase 8 (Clean Up): 2 hours

**Total**: ~27 hours of focused development

---

## Next Steps

1. Review and approve this migration plan
2. Set up development environment
3. Begin Phase 1 (Infrastructure Setup)
4. Incremental testing at each phase
5. Continuous deployment readiness

---

**Document Version**: 1.0  
**Last Updated**: November 24, 2025  
**Author**: Replit Agent  
**Status**: Ready for Implementation
