import { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * Atomically returns the next value for a named counter.
 *
 * Uses `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`, which acquires a
 * row-level lock on the counter row. Concurrent transactions therefore
 * serialize on that single row, guaranteeing unique, gap-free values without
 * relying on `count()` (which breaks with soft-deletes) or Serializable retries.
 *
 * Must be called inside a transaction so the returned number is committed
 * together with the row that consumes it.
 */
export async function nextSequence(tx: TxClient, key: string): Promise<number> {
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "Sequence" ("key", "value") VALUES (${key}, 1)
    ON CONFLICT ("key") DO UPDATE SET "value" = "Sequence"."value" + 1
    RETURNING "value"
  `;
  return rows[0].value;
}
