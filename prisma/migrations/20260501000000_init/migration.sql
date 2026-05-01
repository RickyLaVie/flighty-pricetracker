-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "origin" CHAR(3) NOT NULL,
    "destination" CHAR(3) NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "airline" TEXT NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Route_status_idx" ON "Route"("status");

-- CreateIndex
CREATE INDEX "PriceSnapshot_route_id_scraped_at_idx" ON "PriceSnapshot"("route_id", "scraped_at");

-- CreateIndex
CREATE INDEX "AlertLog_route_id_tier_sent_at_idx" ON "AlertLog"("route_id", "tier", "sent_at");

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
