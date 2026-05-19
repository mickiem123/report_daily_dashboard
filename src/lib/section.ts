import { hose, margin, momoi, phaisinh, scash, sfund } from "@/lib/extractors";
import type { ProductCard, Row } from "@/lib/types";

const PRIORITY = ["hose", "margin", "phaisinh", "scash", "sfund", "momoi"] as const;

const getVerbBucket = (verb: string): number => {
  const normalized = verb.trim().toLowerCase();
  if (normalized.startsWith("tăng") || normalized.startsWith("tang")) return 0;
  if (normalized.startsWith("giảm") || normalized.startsWith("giam")) return 2;
  return 1;
};

const getPriorityRank = (key: string): number => {
  const index = PRIORITY.indexOf(key as (typeof PRIORITY)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export const buildCards = (rows: Row[]): ProductCard[] => {
  if (rows.length === 0) return [];
  const today = rows[rows.length - 1];
  const prev = rows[rows.length - 2] ?? null;
  return [hose(today, prev, rows), margin(today, prev, rows), phaisinh(today, prev, rows), scash(today, prev, rows), sfund(today, prev, rows), momoi(today, prev, rows)];
};

export const sortCards = (cards: ProductCard[]): ProductCard[] =>
  [...cards].sort((a, b) => {
    const bucketDiff = getVerbBucket(a.verb) - getVerbBucket(b.verb);
    if (bucketDiff !== 0) return bucketDiff;
    return getPriorityRank(a.key) - getPriorityRank(b.key);
  });

