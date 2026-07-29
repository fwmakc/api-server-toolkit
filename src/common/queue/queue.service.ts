import { DeepPartial, Repository } from 'typeorm';
import { QueueJobEntity } from './queue-job.entity';

export abstract class QueueService<TJob extends QueueJobEntity> {
  constructor(protected readonly repo: Repository<TJob>) {}

  async enqueue(data: DeepPartial<TJob>): Promise<TJob> {
    return this.repo.save(this.repo.create(data));
  }

  async getStatus(id: number): Promise<TJob | null> {
    return this.repo.findOne({ where: { id } as any });
  }
}
