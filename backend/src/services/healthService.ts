import { DatabaseProbe } from '../repositories/healthRepository';

export interface HealthReport {
  healthy: boolean;
  database: 'up' | 'down';
}

export class HealthService {
  constructor(private readonly probe: DatabaseProbe) {}

  /**
   * Checks whether the database can be reached.
   * Never throws: a failed ping is reported as an unhealthy result.
   */
  async check(): Promise<HealthReport> {
    try {
      await this.probe.ping();
      return { healthy: true, database: 'up' };
    } catch {
      return { healthy: false, database: 'down' };
    }
  }
}
