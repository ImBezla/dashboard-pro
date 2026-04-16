import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/** Erfordert eine aktive Organisations-Mitgliedschaft (organizationId am Request-User). */
@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ForbiddenException(
        'Arbeitsbereich nicht eingerichtet. Bitte Firma gründen oder Beitrittscode eingeben.',
      );
    }
    return true;
  }
}
