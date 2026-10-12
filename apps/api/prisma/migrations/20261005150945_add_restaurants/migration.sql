-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "RestaurantRole" AS ENUM ('OWNER', 'MANAGER', 'EMPLOYEE', 'KITCHEN');

-- AlterTable
ALTER TABLE "superadmin_audit_logs" ADD COLUMN     "restaurant_id" UUID;

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "logo_url" TEXT,
    "cover_url" TEXT,
    "phone" VARCHAR(20),
    "address" TEXT,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "tax_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tax_rate" DECIMAL(5,2),
    "service_charge_enabled" BOOLEAN NOT NULL DEFAULT false,
    "service_charge_rate" DECIMAL(5,2),
    "status" "RestaurantStatus" NOT NULL DEFAULT 'PENDING',
    "suspended_at" TIMESTAMPTZ(6),
    "suspended_by" UUID,
    "suspension_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_members" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "RestaurantRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE INDEX "restaurants_status_created_at_idx" ON "restaurants"("status", "created_at");

-- CreateIndex
CREATE INDEX "restaurants_slug_idx" ON "restaurants"("slug");

-- CreateIndex
CREATE INDEX "restaurant_members_user_id_is_active_idx" ON "restaurant_members"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_members_restaurant_id_user_id_key" ON "restaurant_members"("restaurant_id", "user_id");

-- CreateIndex
CREATE INDEX "superadmin_audit_logs_restaurant_id_idx" ON "superadmin_audit_logs"("restaurant_id");

-- AddForeignKey
ALTER TABLE "superadmin_audit_logs" ADD CONSTRAINT "superadmin_audit_logs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_members" ADD CONSTRAINT "restaurant_members_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_members" ADD CONSTRAINT "restaurant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
