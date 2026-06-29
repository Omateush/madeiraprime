-- AlterTable
ALTER TABLE "properties" ADD COLUMN "ical_token" VARCHAR(64);

-- CreateTable
CREATE TABLE "property_blocks" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" VARCHAR(30) NOT NULL DEFAULT 'manual',
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "external_uid" VARCHAR(255),
    "summary" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_ical_feeds" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_ical_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_ical_token_key" ON "properties"("ical_token");

-- CreateIndex
CREATE UNIQUE INDEX "property_blocks_external_uid_key" ON "property_blocks"("external_uid");

-- CreateIndex
CREATE INDEX "property_blocks_property_id_idx" ON "property_blocks"("property_id");

-- CreateIndex
CREATE INDEX "property_ical_feeds_property_id_idx" ON "property_ical_feeds"("property_id");

-- AddForeignKey
ALTER TABLE "property_blocks" ADD CONSTRAINT "property_blocks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_ical_feeds" ADD CONSTRAINT "property_ical_feeds_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
