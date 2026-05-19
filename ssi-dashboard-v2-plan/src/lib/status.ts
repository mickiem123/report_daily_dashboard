import type { Status, SubMetric } from "@/lib/types";

export function getStatusFromVerb(verb: string): Status {
  const normalized = verb.trim().toLowerCase();
  if (normalized.startsWith("tăng")) return "up";
  if (normalized.startsWith("giảm")) return "down";
  return "flat";
}

export function getDeltaStatus(delta: string, inverse?: SubMetric["inverse"]): Status {
  const trimmed = delta.trim();
  let status: Status = "flat";
  if (trimmed.startsWith("+")) status = "up";
  else if (trimmed.startsWith("-")) status = "down";
  if (!inverse) return status;
  if (status === "up") return "down";
  if (status === "down") return "up";
  return "flat";
}
