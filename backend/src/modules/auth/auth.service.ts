import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../../../../shared/schema';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { LoggingService } from '../../infrastructure/logging/logging.service';

export interface JwtPayload {
  sub: string;
  email: string;
  roleId: number;
  username: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private refreshTokens: Map<string, string> = new Map();

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loggingService: LoggingService,
  ) {}

  async validateUser(emailOrUsername: string, password: string): Promise<any> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.email, emailOrUsername))
      .limit(1)
      .then((results: any[]) => results[0]);

    if (!user) {
      // Try username
      const userByUsername = await this.db
        .select()
        .from(users)
        .where(eq(users.username, emailOrUsername))
        .limit(1)
        .then((results: any[]) => results[0]);

      if (!userByUsername) {
        return null;
      }

      if (await bcrypt.compare(password, userByUsername.passwordHash)) {
        const { passwordHash, ...result } = userByUsername;
        return result;
      }
      return null;
    }

    if (await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async login(loginDto: { email: string; password: string }): Promise<AuthTokens & { user: any }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      this.loggingService.warn('Failed login attempt', 'AuthService', { email: loginDto.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const tokens = await this.generateTokens(user);
    
    this.loggingService.audit('User logged in', user.id, { email: user.email });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
      },
    };
  }

  async register(registerDto: any): Promise<AuthTokens & { user: any }> {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, registerDto.email))
      .limit(1)
      .then((results: any[]) => results[0]);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.db
      .insert(users)
      .values({
        email: registerDto.email,
        username: registerDto.username,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        roleId: registerDto.roleId,
        createdVia: 'self',
      })
      .returning();

    const user = newUser[0];
    const tokens = await this.generateTokens(user);

    this.loggingService.audit('User registered', user.id, { email: user.email });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
      },
    };
  }

  async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    this.refreshTokens.set(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const storedToken = this.refreshTokens.get(payload.sub);
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1)
        .then((results: any[]) => results[0]);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    this.refreshTokens.delete(userId);
    this.loggingService.audit('User logged out', userId);
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((results: any[]) => results[0]);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await this.db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));

    this.loggingService.audit('Password changed', userId);

    return { message: 'Password changed successfully' };
  }
}
