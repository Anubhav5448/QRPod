-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPERADMIN', 'USER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "platform_role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadmin_audit_logs" (
    "id" UUID NOT NULL,
    "superadmin_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" UUID,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "superadmin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "superadmin_audit_logs_superadmin_id_created_at_idx" ON "superadmin_audit_logs"("superadmin_id", "created_at");

-- CreateIndex
CREATE INDEX "superadmin_audit_logs_action_created_at_idx" ON "superadmin_audit_logs"("action", "created_at");

-- AddForeignKey
ALTER TABLE "superadmin_audit_logs" ADD CONSTRAINT "superadmin_audit_logs_superadmin_id_fkey" FOREIGN KEY ("superadmin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
