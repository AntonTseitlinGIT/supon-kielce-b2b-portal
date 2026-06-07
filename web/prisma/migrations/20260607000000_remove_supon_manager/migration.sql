-- Migrate any existing SUPON_MANAGER users to SUPON_ADMIN before removing the enum value
UPDATE "User" SET role = 'SUPON_ADMIN' WHERE role = 'SUPON_MANAGER';

-- PostgreSQL does not support removing enum values directly.
-- We rename the old type, create the new one without SUPON_MANAGER, migrate the column, then drop the old type.
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('BRANCH_HEAD', 'CLIENT_HEAD', 'SUPON_ADMIN', 'SUPON_DEV');
ALTER TABLE "User" ALTER COLUMN role TYPE "Role" USING role::text::"Role";
DROP TYPE "Role_old";
