import type { SealedCommitment } from "./shutter";

const KEY = "govhub.sealed-commitments";

export function loadCommitments(): SealedCommitment[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCommitments(items: SealedCommitment[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private window etc.) — sealing still works,
    // the user just has to keep the commitment JSON themselves.
  }
}
