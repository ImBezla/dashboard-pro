import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const globalRole = user?.role;
    const orgRole = user?.orgRole;

    const canManage =
      globalRole === 'ADMIN' ||
      globalRole === 'MANAGER' ||
      orgRole === 'OWNER' ||
      orgRole === 'ADMIN';

    if (required.includes('ADMIN') || required.includes('MANAGER')) {
      if (!canManage) {
        throw new ForbiddenException('Unzureichende Berechtigung');
      }
      return true;
    }

    if (!globalRole) {
      throw new ForbiddenException('Keine Rolle am Benutzer');
    }
    if (!required.includes(globalRole)) {
      throw new ForbiddenException('Unzureichende Berechtigung');
    }
    return true;
  }
}
