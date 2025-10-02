import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SecureAuthService, SecureSession } from '../secure-auth.service';
import { User } from '../../../database/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: SecureSession;
  sessionId?: string;
}

@Injectable()
export class SecureAuthGuard implements CanActivate {
  private readonly logger = new Logger(SecureAuthGuard.name);

  constructor(private secureAuthService: SecureAuthService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

      // Check if route is marked as public
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      // Extract session ID from cookie
      const sessionId = request.cookies?.sessionId;

      if (!sessionId) {
        throw new UnauthorizedException('No session found');
      }

      // Validate session
      const session = await this.secureAuthService.validateSession(sessionId);

      if (!session) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Get the full user entity
      const user = await this.secureAuthService.getCurrentUser(sessionId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user and session to request
      request.user = user;
      request.session = session;
      request.sessionId = sessionId;

      return true;
    } catch (error) {
      this.logger.error('Authentication error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
