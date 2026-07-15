import { ClientProxy } from "@nestjs/microservices";
import { EventBusPattern } from "./event-bus.constants";
export declare class EventBusService {
    private readonly client;
    private readonly logger;
    constructor(client: ClientProxy);
    emit<T>(pattern: EventBusPattern, payload: T, source: string): void;
}
