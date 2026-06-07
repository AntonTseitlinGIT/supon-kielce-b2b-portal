import "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    clientId: string | null;
    branchId: string | null;
    clientName: string | null;
    branchName: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      clientId: string | null;
      branchId: string | null;
      clientName: string | null;
      branchName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    clientId: string | null;
    branchId: string | null;
    clientName: string | null;
    branchName: string | null;
  }
}
