import "next-auth";

import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}

