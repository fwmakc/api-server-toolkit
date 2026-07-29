import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { IEventClient } from "./event-client.interfaces";
import { HttpEventClient } from "./event-client.service";

@Module({
  imports: [ConfigModule],
  providers: [
    HttpEventClient,
    { provide: IEventClient, useExisting: HttpEventClient },
  ],
  exports: [IEventClient],
})
export class EventClientModule {}
