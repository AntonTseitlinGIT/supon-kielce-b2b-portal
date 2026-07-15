-- CreateTable
CREATE TABLE "Sequence" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("key")
);

-- Seed counters from existing row counts so newly generated numbers continue
-- the existing sequence without colliding with already-issued document numbers.
INSERT INTO "Sequence" ("key", "value") VALUES
    ('order', (SELECT COUNT(*)::int FROM "Order")),
    ('wz', (SELECT COUNT(*)::int FROM "WzDocument")),
    ('delivery', (SELECT COUNT(*)::int FROM "Delivery")),
    ('ticket', (SELECT COUNT(*)::int FROM "Ticket"))
ON CONFLICT ("key") DO NOTHING;
