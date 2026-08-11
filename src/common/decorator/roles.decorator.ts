import { SetMetadata } from "@nestjs/common";
import { ROLES_METADATA } from "../guard/roles.guard";

export const Roles = (...roles: string[]) => SetMetadata(ROLES_METADATA, roles);
