import 'reflect-metadata';
import { HealthController, HEALTH_SERVICE_NAME } from '../common/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController('test-service');
  });

  it('returns object with status ok', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
  });

  it('returns the injected service name', () => {
    const result = controller.health();
    expect(result.service).toBe('test-service');
  });

  it('returns an ISO timestamp string', () => {
    const result = controller.health();
    expect(result.timestamp).toEqual(expect.any(String));
    expect(() => new Date(result.timestamp)).not.toThrow();
  });

  it('returns different service name when injected differently', () => {
    const other = new HealthController('api-server');
    expect(other.health().service).toBe('api-server');
  });
});
