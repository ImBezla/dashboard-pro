import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      userCount,
      organizationCount,
      verifiedUserCount,
      usersCreatedLast7Days,
      newsletterConfirmed,
      newsletterPending,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.newsletterSubscription.count({
        where: { confirmedAt: { not: null } },
      }),
      this.prisma.newsletterSubscription.count({
        where: { confirmedAt: null },
      }),
    ]);

    const recentOrganizations = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        name: true,
        kind: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    });

    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerifiedAt: true,
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        users: userCount,
        organizations: organizationCount,
        usersEmailVerified: verifiedUserCount,
        usersEmailUnverified: userCount - verifiedUserCount,
        usersNewLast7Days: usersCreatedLast7Days,
        newsletterSubscriptionsConfirmed: newsletterConfirmed,
        newsletterSubscriptionsPendingConfirm: newsletterPending,
      },
      recentOrganizations: recentOrganizations.map((o) => ({
        id: o.id,
        name: o.name,
        kind: o.kind,
        memberCount: o._count.members,
        createdAt: o.createdAt.toISOString(),
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        globalRole: u.role,
        createdAt: u.createdAt.toISOString(),
        emailVerified: !!u.emailVerifiedAt,
      })),
    };
  }
}
