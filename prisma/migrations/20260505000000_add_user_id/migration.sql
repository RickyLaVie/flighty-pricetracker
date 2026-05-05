ALTER TABLE "Route" ADD COLUMN "user_id" TEXT;
CREATE INDEX "Route_user_id_idx" ON "Route"("user_id");
