import { Request, Response } from 'express';
export declare class Cookie {
    private request;
    private response;
    constructor(request: Request, response: Response);
    set(name: string, data: string | number): void;
    setJson(name: string, data: any): void;
    get(name: string): any;
    getJson(name: string): any;
    reset(name: string): void;
}
