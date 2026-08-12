import { ValidationPipe as NestValidationPipe } from '@nestjs/common';

export const ValidationPipe = {
  setup(app: any, opts?: { transform?: boolean; whitelist?: boolean; forbidNonWhitelisted?: boolean }): void {
    app.useGlobalPipes(new NestValidationPipe({
      transform: opts?.transform ?? true,
      whitelist: opts?.whitelist ?? true,
      forbidNonWhitelisted: opts?.forbidNonWhitelisted ?? true,
    }));
  },
};
