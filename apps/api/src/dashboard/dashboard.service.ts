import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PURCHASE_ORDER_COMPLETED_STATUSES } from '../common/purchase-order-status';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(organizationId: string) {
    const [projects, tasks, teams] = await Promise.all([
      this.prisma.project.findMany({
        where: { organizationId },
        include: {
          tasks: true,
          team: true,
        },
      }),
      this.prisma.task.findMany({
        where: { project: { organizationId } },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          project: true,
        },
      }),
      this.prisma.team.findMany({
        where: { organizationId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Filter active projects - also include projects with status 'IN_PROGRESS' or 'PENDING' as active
    const activeProjects = projects.filter(
      (p) =>
        p.status === 'ACTIVE' ||
        p.status === 'IN_PROGRESS' ||
        p.status === 'PENDING',
    );
    const completedTasks = tasks.filter((t) => t.status === 'DONE');
    const openTasks = tasks.filter((t) => t.status === 'OPEN');
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');

    // Calculate team performance based on task completion
    // Method 1: Performance per team (based on team's project tasks)
    const teamPerformance = teams.map((team) => {
      const teamTasks = tasks.filter(
        (task) => task.project?.teamId === team.id,
      );
      const completedTeamTasks = teamTasks.filter((t) => t.status === 'DONE');
      const performance =
        teamTasks.length > 0
          ? Math.round((completedTeamTasks.length / teamTasks.length) * 100)
          : 0;

      return {
        teamId: team.id,
        teamName: team.name,
        performance,
        totalTasks: teamTasks.length,
        completedTasks: completedTeamTasks.length,
      };
    });

    // Method 2: Calculate performance based on all team members' tasks
    // This gives a more accurate overall performance
    const allTeamMemberTasks = teams.flatMap((team) =>
      team.members.flatMap((member) =>
        tasks.filter((task) => task.assignedToId === member.userId),
      ),
    );

    // Also include tasks from projects that belong to teams
    const teamProjectTasks = tasks.filter((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      return project && project.teamId;
    });

    // Combine both: tasks assigned to team members AND tasks from team projects
    const allRelevantTasks = [
      ...allTeamMemberTasks,
      ...teamProjectTasks.filter(
        (t) => !allTeamMemberTasks.some((mt) => mt.id === t.id),
      ),
    ];

    const allTeamMemberCompletedTasks = allRelevantTasks.filter(
      (t) => t.status === 'DONE',
    );

    // Overall team performance: based on all tasks assigned to team members or from team projects
    const overallTeamPerformance =
      allRelevantTasks.length > 0
        ? Math.round(
            (allTeamMemberCompletedTasks.length / allRelevantTasks.length) *
              100,
          )
        : 0;

    // Get top performing team members
    // Include all team members, even if they don't have tasks yet
    const teamMembers = teams
      .flatMap((team) =>
        team.members.map((member) => {
          const memberTasks = tasks.filter(
            (t) => t.assignedToId === member.userId,
          );
          const teamProjects = projects.filter((p) => p.teamId === team.id);

          // Get projects where member has tasks OR projects from their team
          const memberProjectIds = new Set(
            memberTasks.map((t) => t.projectId).filter(Boolean),
          );
          teamProjects.forEach((p) => memberProjectIds.add(p.id));

          // Get actual project names
          const memberProjects = Array.from(memberProjectIds)
            .map((pid) => projects.find((p) => p.id === pid))
            .filter(Boolean)
            .map((p) => ({ id: p.id, name: p.name, status: p.status }));

          return {
            ...member.user,
            teamRole: member.role,
            teamName: team.name,
            teamId: team.id,
            tasks: memberTasks,
            projects: memberProjects,
          };
        }),
      )
      .map((member) => {
        const completed = member.tasks.filter(
          (t) => t.status === 'DONE',
        ).length;
        const total = member.tasks.length;
        const performance =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          role: member.teamRole,
          teamName: member.teamName,
          projectsCount: member.projects.length,
          projects: member.projects.slice(0, 3), // Include first 3 projects for display
          performance,
          tasksCount: total,
        };
      })
      // Sort by performance (descending), then by tasks count
      .sort((a, b) => {
        if (b.performance !== a.performance)
          return b.performance - a.performance;
        return b.tasksCount - a.tasksCount;
      })
      .slice(0, 10);

    // Project summaries - show all active projects first, then others
    const sortedProjects = [...projects].sort((a, b) => {
      // Active projects first (ACTIVE, IN_PROGRESS, PENDING)
      const aIsActive =
        a.status === 'ACTIVE' ||
        a.status === 'IN_PROGRESS' ||
        a.status === 'PENDING';
      const bIsActive =
        b.status === 'ACTIVE' ||
        b.status === 'IN_PROGRESS' ||
        b.status === 'PENDING';
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Show all active projects, not just 5
    const projectSummaries = sortedProjects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const completed = projectTasks.filter((t) => t.status === 'DONE').length;
      const progress =
        projectTasks.length > 0
          ? Math.round((completed / projectTasks.length) * 100)
          : 0;

      // Get team information
      const projectTeam = project.teamId
        ? teams.find((t) => t.id === project.teamId)
        : null;

      // Get team members working on this project
      const projectTeamMembers = projectTeam
        ? projectTeam.members
            .map((member) => ({
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              role: member.role,
            }))
            .slice(0, 5) // Limit to 5 members for display
        : [];

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        progress,
        deadline: project.deadline,
        tasksCount: projectTasks.length,
        completedTasks: completed,
        teamId: project.teamId,
        teamName: projectTeam?.name || null,
        teamMembers: projectTeamMembers,
        teamMembersCount: projectTeam?.members.length || 0,
      };
    });

    // Tasks summary - include project and team information
    const tasksSummary = {
      total: tasks.length,
      open: openTasks.length,
      inProgress: inProgressTasks.length,
      done: completedTasks.length,
      highPriority: tasks.filter((t) => t.priority === 'HIGH').length,
      recent: tasks
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 10)
        .map((task) => {
          const project = projects.find((p) => p.id === task.projectId);
          const projectTeam = project
            ? teams.find((t) => t.id === project.teamId)
            : null;

          return {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline,
            assignee: task.assignedTo,
            project: project
              ? {
                  id: project.id,
                  name: project.name,
                  status: project.status,
                  teamId: project.teamId,
                  teamName: projectTeam?.name || null,
                }
              : null,
          };
        }),
    };

    // Calculate average team performance
    // Use overall team performance if available, otherwise average of individual teams
    let avgTeamPerformance = 0;

    if (overallTeamPerformance > 0) {
      // Use overall performance (more accurate)
      avgTeamPerformance = overallTeamPerformance;
    } else if (teamPerformance.length > 0) {
      // Fallback: average of individual team performances
      const teamsWithTasks = teamPerformance.filter((t) => t.totalTasks > 0);
      if (teamsWithTasks.length > 0) {
        avgTeamPerformance = Math.round(
          teamsWithTasks.reduce((sum, t) => sum + t.performance, 0) /
            teamsWithTasks.length,
        );
      } else {
        // If no teams have tasks, calculate from all tasks
        avgTeamPerformance =
          tasks.length > 0
            ? Math.round((completedTasks.length / tasks.length) * 100)
            : 0;
      }
    } else {
      // Fallback: overall task completion rate
      avgTeamPerformance =
        tasks.length > 0
          ? Math.round((completedTasks.length / tasks.length) * 100)
          : 0;
    }

    // Calculate revenue from purchase orders (if available)
    let revenue = 0;
    try {
      const purchaseOrders = await this.prisma.purchaseOrder.findMany({
        where: {
          organizationId,
          status: { in: [...PURCHASE_ORDER_COMPLETED_STATUSES] },
          orderDate: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 3,
              1,
            ), // Last 3 months
          },
        },
      });
      revenue = purchaseOrders.reduce((sum, order) => sum + order.total, 0);
    } catch {
      revenue = 0;
    }

    // Calculate activity insights (automated actions = activity logs)
    let aiInsightsCount = 0;
    try {
      const activityLogs = await this.prisma.activityLog.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
          },
        },
      });
      aiInsightsCount = activityLogs.length;
    } catch {
      aiInsightsCount = 0;
    }

    // Calculate trends
    const previousMonthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1,
    );
    const previousMonthEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      0,
    );

    const [previousProjects, previousTasks] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
      }),
      this.prisma.task.findMany({
        where: {
          project: { organizationId },
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
      }),
    ]);

    const previousActiveProjects = previousProjects.filter(
      (p) => p.status === 'ACTIVE',
    ).length;
    const projectsTrend = activeProjects.length - previousActiveProjects;

    const previousCompletedTasks = previousTasks.filter(
      (t) => t.status === 'DONE',
    ).length;
    const tasksTrend = completedTasks.length - previousCompletedTasks;

    // Calculate previous month team performance for trend
    const previousMonthTeamTasks = previousTasks.filter((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      return project && project.teamId;
    });
    const previousMonthCompletedTeamTasks = previousMonthTeamTasks.filter(
      (t) => t.status === 'DONE',
    );
    const previousMonthTeamPerformance =
      previousMonthTeamTasks.length > 0
        ? Math.round(
            (previousMonthCompletedTeamTasks.length /
              previousMonthTeamTasks.length) *
              100,
          )
        : 0;

    const teamPerformanceTrend =
      avgTeamPerformance - previousMonthTeamPerformance;

    // Calculate revenue trend (compare with previous 3 months)
    const previousQuarterStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 6,
      1,
    );
    const previousQuarterEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 3,
      0,
    );

    let revenueTrend = 0;
    try {
      const previousQuarterOrders = await this.prisma.purchaseOrder.findMany({
        where: {
          organizationId,
          status: { in: [...PURCHASE_ORDER_COMPLETED_STATUSES] },
          orderDate: {
            gte: previousQuarterStart,
            lte: previousQuarterEnd,
          },
        },
      });
      const previousQuarterRevenue = previousQuarterOrders.reduce(
        (sum, order) => sum + order.total,
        0,
      );
      revenueTrend =
        previousQuarterRevenue > 0
          ? Math.round(
              ((revenue - previousQuarterRevenue) / previousQuarterRevenue) *
                100,
            )
          : revenue > 0
            ? 100
            : 0;
    } catch {
      revenueTrend = 0;
    }

    const result = {
      teamPerformance: avgTeamPerformance,
      activeProjectsCount: activeProjects.length,
      revenue,
      aiInsightsCount,
      projectSummaries,
      tasksSummary,
      teamMembers,
      trends: {
        projects: projectsTrend,
        tasks: tasksTrend,
        teamPerformance: teamPerformanceTrend,
        revenue: revenueTrend,
      },
    };

    return result;
  }
}
