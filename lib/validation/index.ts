import { z } from "zod";

export const userRoleSchema = z.enum(["worker", "employer", "admin", "super_admin"]);

export type UserRole = z.infer<typeof userRoleSchema>;
