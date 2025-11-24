import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ParentsModule } from './modules/parents/parents.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ResultsModule } from './modules/results/results.module';
import { ExamsModule } from './modules/exams/exams.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { EmailModule } from './infrastructure/email/email.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    // Infrastructure
    StorageModule,
    LoggingModule,
    EmailModule,

    // Core Modules
    AuthModule,
    UsersModule,
    RolesModule,

    // School Modules
    StudentsModule,
    TeachersModule,
    ParentsModule,
    ClassesModule,
    SubjectsModule,
    AttendanceModule,
    ResultsModule,
    ExamsModule,
    PaymentsModule,

    // Features
    FilesModule,
    NotificationsModule,
    RealtimeModule,
    AuditModule,
  ],
})
export class AppModule {}
