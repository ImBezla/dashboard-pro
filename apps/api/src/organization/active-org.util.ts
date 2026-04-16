import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

export type MembershipWithOrg = Prisma.OrganizationMemberGetPayload<{
  include: { organization: true };
}>;

/**
 * Wählt die Membership für Auth/JWT: bevorzugt JWT-Org, sonst User.activeOrganizationId, sonst erste Membership.
 */
export async function pickOrganizationMembership(
  prisma: PrismaService,
  userId: string,
  jwtOrganizationId?: string | null,
): Promise<{ membership: MembershipWithOrg | null; all: MembershipWithOrg[] }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeOrganizationId: true },
  });

  const all = await prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { id: 'asc' },
  });

  if (!all.length) {
    return { membership: null, all: [] };
  }

  const candidates = [jwtOrganizationId, user?.activeOrganizationId].filter(
    (id): id is string => Boolean(id),
  );

  for (const orgId of candidates) {
    const found = all.find((m) => m.organizationId === orgId);
    if (found) return { membership: found, all };
  }

  return { membership: all[0], all };
}
