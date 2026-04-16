import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller()
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'DashboardPro API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'DashboardPro API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
