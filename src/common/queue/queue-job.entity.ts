import { Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { QueueStatus } from './queue.interfaces';

export abstract class QueueJobEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: QueueStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'last_attempt_at', type: 'timestamptz', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ name: 'next_attempt_at', type: 'timestamptz', nullable: true })
  nextAttemptAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
