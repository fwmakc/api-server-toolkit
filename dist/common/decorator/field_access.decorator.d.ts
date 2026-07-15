import { AccessLevel } from '../access.type';
export interface FieldAccessOptions {
    read?: AccessLevel;
    write?: AccessLevel;
}
export declare const FIELD_ACCESS_METADATA = "fieldAccess";
export declare function FieldAccess(options: FieldAccessOptions): (target: any, propertyKey: string) => void;
