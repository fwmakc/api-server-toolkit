import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class SafeIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const str = String(value ?? '').trim();
    if (!/^\d+$/.test(str)) {
      throw new BadRequestException(`Invalid id: ${value}`);
    }
    return str;
  }
}
