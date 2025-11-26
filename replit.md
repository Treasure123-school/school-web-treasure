# Treasure-Home School Management System

A comprehensive school management system with JWT authentication, dual-database architecture, and cloud-based file storage.

## Project Overview

**Current Status**: ✅ Production-Ready Architecture Implemented

### Key Features
- 🔐 JWT Authentication (no Supabase Auth)
- 📊 40+ Database Tables with Complete Schema
- 👥 5 Role-Based Access Levels: Super Admin, Admin, Teacher, Student, Parent
- 📁 Cloudinary Integration for Cloud File Storage
- 🗄️ PostgreSQL/Neon Database (SQLite removed for cloud compatibility)
- 📱 Real-time Updates via Socket.IO
- 📋 Comprehensive Exam System with Auto-Grading
- 📚 Study Resources Management
- 👤 Multi-Profile Support (Teacher, Admin, Parent, Student)
- 🎓 Report Cards & Performance Tracking
- ✅ Attendance Management
- 📢 Announcements & Messaging System
- 🖼️ Gallery Management
- 💼 Job Vacancy & Teacher Applications System

## Architecture

### Database Layer
- **All Environments**: PostgreSQL via Neon (DATABASE_URL required)
- **SQLite Support**: REMOVED (was causing deployment failures on cloud platforms)
- **Important**: DATABASE_URL must be set for the application to start

### File Storage Layer
- **Development**: Local filesystem (./server/uploads/)
- **Production**: Cloudinary CDN (with automatic fallback to local)
- **Unified Interface**: server/cloudinary-service.ts

### Schema Organization
- **PostgreSQL Schema**: shared/schema.pg.ts (40+ tables with PostgreSQL types)
- **Legacy SQLite Schema**: shared/schema.ts (deprecated, not used)
- **Types**: Auto-generated from schemas using Drizzle Zod

## Environment Configuration

### Development (Default)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://... # Neon PostgreSQL (REQUIRED)
# Storage: Local filesystem
# Optional: JWT_SECRET (uses fallback if not set)
```

### Production (Render)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://... # Neon PostgreSQL
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET=... # 32+ characters
SESSION_SECRET=... # 32+ characters
FRONTEND_URL=https://your-vercel-app.vercel.app
BACKEND_URL=https://your-render-app.onrender.com
```

## Deployment

### Backend (Render)
- Runtime: Node.js
- Build: `npm install --include=dev && npm run build`
- Start: `npm run start`
- Database: Neon PostgreSQL (no persistent disk needed)
- Storage: Cloudinary CDN
- Health Check: `/api/health`

### Frontend (Vercel)
- Framework: Vite + React
- Build: `npm run build`
- Deploy: Vercel CLI or connected GitHub

### No Persistent Disk Required
Unlike traditional setups, this architecture uses:
- **Database**: Cloud-hosted Neon PostgreSQL (fully managed)
- **Files**: Cloudinary CDN (fully managed)
- **Result**: Stateless backend that scales horizontally

## Database Schemas (40+ Tables)

### Core User Management
- users
- roles
- passwordResetTokens
- passwordResetAttempts
- invites
- notifications

### User Profiles
- teacherProfiles
- adminProfiles
- parentProfiles
- superAdminProfiles
- students

### Academic Structure
- classes
- subjects
- academicTerms
- teacherClassAssignments
- timetable

### Exam & Assessment
- exams
- examQuestions
- questionOptions
- examSessions
- studentAnswers
- examResults
- gradingTasks
- questionBanks
- questionBankItems
- questionBankOptions

### Academic Records
- attendance
- reportCards
- reportCardItems
- studyResources
- performanceEvents

### Communication & Content
- announcements
- messages
- gallery
- galleryCategories
- homePageContent
- contactMessages

### System & Administration
- systemSettings
- settings
- counters
- auditLogs
- vacancies
- teacherApplications
- approvedTeachers

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server (auto-restarts on changes)
npm run dev

# Server runs on http://localhost:5000
# Frontend accessible at same port
```

### Test Account Credentials
All test accounts created automatically on startup:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Super Admin | superadmin | SuperAdmin@123 | superadmin@treasurehome.com |
| Admin | admin | Admin@123 | admin@treasurehome.com |
| Teacher | teacher | Teacher@123 | teacher@treasurehome.com |
| Student | student | Student@123 | student@treasurehome.com |
| Parent | parent | Parent@123 | parent@treasurehome.com |

### Database Migrations
```bash
# Push schema changes to database
npm run db:push

# Force push (if needed)
npm run db:push -- --force

# Generate SQL migrations
npm run db:generate
```

## File Organization

```
project/
├── server/                    # Backend (Express + TypeScript)
│   ├── index.ts              # Express app setup
│   ├── routes.ts             # API routes (5973 lines)
│   ├── storage.ts            # SQLite storage layer
│   ├── db.ts                 # Database factory
│   ├── cloudinary-service.ts # Cloudinary integration
│   ├── upload-service.ts     # Unified upload interface
│   ├── env-validation.ts     # Environment validation
│   ├── auth-utils.ts         # Authentication utilities
│   ├── realtime-service.ts   # Socket.IO setup
│   ├── seed-*.ts             # Database seeders
│   ├── data/                 # Local database (dev only)
│   └── uploads/              # Local file storage (dev only)
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   └── vite.config.ts       # Vite configuration
├── shared/                    # Shared types & schemas
│   ├── schema.ts            # SQLite Drizzle schema
│   └── schema.pg.ts         # PostgreSQL Drizzle schema
├── drizzle.config.ts        # Drizzle Kit config
├── package.json             # Dependencies
└── render.yaml              # Render deployment config
```

## Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Drizzle ORM (SQLite + PostgreSQL)
- **Authentication**: JWT + Passport.js
- **Real-time**: Socket.IO
- **File Storage**: Cloudinary SDK
- **Validation**: Zod schemas
- **Password Hashing**: bcrypt

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: Wouter
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS

### DevOps
- **Dev Database**: SQLite (better-sqlite3)
- **Prod Database**: PostgreSQL/Neon
- **File Storage**: Cloudinary CDN
- **Backend Deployment**: Render
- **Frontend Deployment**: Vercel
- **CI/CD**: Git push auto-deploy

## Performance Considerations

### Database Optimization
- ✅ Indexes on frequently queried columns
- ✅ Foreign key relationships enforced
- ✅ SQLite WAL mode for concurrent access
- ✅ PostgreSQL connection pooling (Neon)

### File Storage
- ✅ Automatic image optimization (Cloudinary)
- ✅ CDN distribution
- ✅ WebP format support
- ✅ Responsive image sizes

### Caching Strategy
- ✅ TanStack Query caching on frontend
- ✅ Browser cache headers
- ✅ Gzip compression enabled
- ✅ Static asset optimization

## Security Features

- ✅ JWT tokens with 24-hour expiration
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ CORS configuration for specific origins
- ✅ Rate limiting on authentication endpoints
- ✅ Account lockout after failed attempts
- ✅ Two-factor authentication support
- ✅ Audit logging for sensitive operations
- ✅ Role-based access control (RBAC)
- ✅ Environment-based secrets management

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (JWT)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/change-password` - Change password

### User Management
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Exams
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams/:id/submit` - Submit exam
- `GET /api/exams/:id/results` - Get results

### And 100+ more endpoints...

## Known Limitations & Future Work

- [ ] Video streaming support (currently images only)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (currently web-only)
- [ ] Offline mode support
- [ ] Email notification system (partial)
- [ ] SMS notifications (configured but not implemented)

## Troubleshooting

### Database Connection Issues
- Check DATABASE_URL environment variable in production
- Verify SQLite database file exists at ./server/data/app.db in development
- Run `npm run db:push` to sync schema

### File Upload Issues
- Verify Cloudinary credentials in production
- Check file size limits (5MB for images, 10MB for documents)
- Ensure server/uploads directory exists in development

### Port Conflicts
- Change PORT environment variable if 5000 is in use
- Frontend and backend run on same port (5000) via Vite proxy

## Contributing

1. Follow existing code style and conventions
2. Add tests for new features
3. Update replit.md for architectural changes
4. Use semantic commit messages
5. Test locally before pushing

## License

Proprietary - Treasure-Home School
