import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, RedisClientType } from 'redis';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

import { User, UserType } from '../../database/entities';
import { UsersService } from '../users/users.service';
import { EnhancedPermissionCheckService } from '../permissions/enhanced-permission-check.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface SecureSession {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecureAuthResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    roles: string[];
    permissions: string[];
  };
  sessionId: string;
}

@Injectable()
export class SecureAuthService {
  private readonly logger = new Logger(SecureAuthService.name);
  private redisClient: RedisClientType | null = null;
  private memoryStore: Map<string, string> = new Map(); // Fallback memory store

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private enhancedPermissionService: EnhancedPermissionCheckService
  ) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisPassword = this.configService.get('REDIS_PASSWORD');
      const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');

      const clientConfig: any = {
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: retries => {
            if (retries > 3) {
              this.logger.warn('Redis max reconnection attempts reached, using memory store');
              return false;
            }
            return Math.min(retries * 50, 500);
          },
        },
      };

      // Only add password if it exists and is not empty
      if (redisPassword && redisPassword.trim() !== '') {
        clientConfig.password = redisPassword;
      }

      this.redisClient = createClient(clientConfig);

      this.redisClient.on('error', err => {
        this.logger.warn('Redis Client Error (using fallback memory store):', err.message);
      });

      this.redisClient.on('connect', () => {
        this.logger.log('✅ Redis connected successfully for secure auth');
      });

      this.redisClient.on('ready', () => {
        this.logger.log('✅ Redis ready for secure auth operations');
      });

      // Try to connect with timeout
      await Promise.race([
        this.redisClient.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        ),
      ]);
    } catch (error) {
      this.logger.warn(
        'Redis connection failed, using in-memory session store for development:',
        error.message
      );
      this.redisClient = null; // Use fallback memory store
    }
  }

  private async setSession(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.setEx(key, ttlSeconds, value);
    } else {
      this.memoryStore.set(key, value);
      // Set timeout for memory store expiration
      setTimeout(() => {
        this.memoryStore.delete(key);
      }, ttlSeconds * 1000);
    }
  }

  private async getSession(key: string): Promise<string | null> {
    if (this.redisClient) {
      const result = await this.redisClient.get(key);
      return typeof result === 'string' ? result : null;
    } else {
      return this.memoryStore.get(key) || null;
    }
  }

  private async deleteSession(key: string): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.del(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  async login(loginDto: LoginDto, req: Request, res: Response): Promise<SecureAuthResponse> {
    try {
      const { email, password } = loginDto;

      // Validate user credentials
      const user = await this.usersService.findByEmail(email);
      if (!user || !user.isActive || !(await user.validatePassword(password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get permissions using comprehensive permission service for organization users
      let permissions: string[] = [];
      try {
        if (user.userType === UserType.ORGANIZATION_ADMIN || user.userType === UserType.ORGANIZATION_USER) {
          if (user.organizationId) {
            const userPermissions = await this.enhancedPermissionService.getUserPermissions(
              user.id,
              user.organizationId
            );
            permissions = userPermissions.allPermissions;
            this.logger.log(`Got ${permissions.length} permissions for user ${user.email} from enhanced service: ${JSON.stringify(permissions.slice(0, 5))}`);
          }
        } else {
          // Fallback to role-based permissions for other user types
          permissions = this.extractPermissions(user);
          this.logger.log(`Got ${permissions.length} permissions for user ${user.email} from role extraction`);
        }
      } catch (error) {
        this.logger.error(`Error getting permissions for user ${user.email}:`, error);
        // Fallback to role-based permissions
        permissions = this.extractPermissions(user);
        this.logger.log(`Fallback: Got ${permissions.length} permissions for user ${user.email} from role extraction`);
      }

      // Create secure session
      const sessionId = uuidv4();
      const session: SecureSession = {
        userId: user.id,
        email: user.email,
        roles: user.roles?.map(role => role.name) || [],
        permissions,
        sessionId,
        createdAt: new Date(),
        lastActivity: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      };

      // Store session with expiration
      const sessionKey = `session:${sessionId}`;
      const sessionTTL = 24 * 60 * 60; // 24 hours
      await this.setSession(sessionKey, JSON.stringify(session), sessionTTL);

      // Set HTTP-only cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: this.configService.get('NODE_ENV') === 'production' ? 'strict' : 'lax',
        maxAge: sessionTTL * 1000,
        path: '/',
      });

      // Update last login
      await this.userRepository.update(user.id, {
        lastLogin: new Date(),
      });

      this.logger.log(`User ${email} logged in successfully with session ${sessionId}`);

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          roles: session.roles,
          permissions: session.permissions,
        },
        sessionId,
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<SecureSession | null> {
    try {
      if (!sessionId) {
        return null;
      }

      const sessionKey = `session:${sessionId}`;
      const sessionData = await this.getSession(sessionKey);

      if (!sessionData || typeof sessionData !== 'string') {
        return null;
      }

      const session: SecureSession = JSON.parse(sessionData);

      // Update last activity
      session.lastActivity = new Date();
      const sessionTTL = 24 * 60 * 60; // 24 hours
      await this.setSession(sessionKey, JSON.stringify(session), sessionTTL);

      return session;
    } catch (error) {
      this.logger.error('Session validation error:', error);
      return null;
    }
  }

  async logout(sessionId: string, res: Response): Promise<{ success: boolean; message: string }> {
    try {
      if (sessionId) {
        const sessionKey = `session:${sessionId}`;
        await this.deleteSession(sessionKey);
      }

      // Clear cookie
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: this.configService.get('NODE_ENV') === 'production' ? 'strict' : 'lax',
        path: '/',
      });

      this.logger.log(`Session ${sessionId} logged out successfully`);

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      this.logger.error('Logout error:', error);
      throw error;
    }
  }

  async register(registerDto: RegisterDto): Promise<SecureAuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Create new user
      const user = await this.usersService.create(registerDto);

      this.logger.log(`User ${registerDto.email} registered successfully`);

      return {
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          roles: user.roles?.map(role => role.name) || [],
          permissions: this.extractPermissions(user),
        },
        sessionId: '', // No auto-login after registration
      };
    } catch (error) {
      this.logger.error('Registration error:', error);
      throw error;
    }
  }

  async getCurrentUser(sessionId: string): Promise<User | null> {
    try {
      const session = await this.validateSession(sessionId);
      if (!session) {
        return null;
      }

      return await this.usersService.findById(session.userId);
    } catch (error) {
      this.logger.error('Get current user error:', error);
      return null;
    }
  }

  private extractPermissions(user: User): string[] {
    const permissions: string[] = [];

    if (user.roles) {
      user.roles.forEach(role => {
        if (role.rolePermissions) {
          role.rolePermissions.forEach(rolePermission => {
            const permissionString = `${rolePermission.module}:${rolePermission.action}`;
            if (!permissions.includes(permissionString) && rolePermission.enabled) {
              permissions.push(permissionString);
            }
          });
        }
      });
    }

    return permissions;
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      // This would require scanning Redis keys, which is expensive
      // For production, consider maintaining a user-session mapping
      this.logger.log(`Invalidating all sessions for user ${userId}`);
    } catch (error) {
      this.logger.error('Error invalidating user sessions:', error);
    }
  }
}
