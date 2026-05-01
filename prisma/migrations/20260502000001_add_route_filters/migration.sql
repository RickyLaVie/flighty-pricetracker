ALTER TABLE "Route" ADD COLUMN "exclude_budget_airlines" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Route" ADD COLUMN "require_checked_baggage" BOOLEAN NOT NULL DEFAULT false;
