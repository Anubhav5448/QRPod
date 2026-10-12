-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'INACTIVE');

-- CreateTable
CREATE TABLE "tables" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "table_number" VARCHAR(30) NOT NULL,
    "display_name" VARCHAR(80),
    "seats" INTEGER,
    "qr_token" VARCHAR(128) NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tables_qr_token_key" ON "tables"("qr_token");

-- CreateIndex
CREATE INDEX "tables_restaurant_id_status_idx" ON "tables"("restaurant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tables_restaurant_id_table_number_key" ON "tables"("restaurant_id", "table_number");

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
