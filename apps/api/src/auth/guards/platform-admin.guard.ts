import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { isPlatformAdminUser } from '../../common/platform-admin.util';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as
      | { email?: string; role?: string }
      | undefined;
    if (!user?.email) {
      throw new ForbiddenException('Kein Plattform-Admin-Zugriff');
    }
    if (!isPlatformAdminUser(user.email, user.role)) {
      throw new ForbiddenException('Kein Plattform-Admin-Zugriff');
    }
    return true;
  }
}
