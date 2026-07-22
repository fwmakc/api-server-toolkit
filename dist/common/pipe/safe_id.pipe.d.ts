import { PipeTransform } from '@nestjs/common';
export declare class SafeIdPipe implements PipeTransform<string, string> {
    transform(value: string): string;
}
