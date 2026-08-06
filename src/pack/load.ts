import type { QuizPack } from "./types";
import { witchTrialPack } from "@/content/packs/witch-trial";

const PACKS: Record<string, QuizPack> = {
  [witchTrialPack.id]: witchTrialPack,
};

/** Active pack id — env override for future multi-pack; default witch-trial */
export function getActivePackId(): string {
  const fromEnv =
    typeof process !== "undefined" ? process.env?.ACTIVE_PACK?.trim() : undefined;
  return fromEnv || "witch-trial";
}

export function getActivePack(): QuizPack {
  const id = getActivePackId();
  const pack = PACKS[id];
  if (!pack) {
    throw new Error(`Unknown content pack: ${id}. Known: ${Object.keys(PACKS).join(", ")}`);
  }
  return pack;
}

export function getPack(id: string): QuizPack {
  const pack = PACKS[id];
  if (!pack) throw new Error(`Unknown content pack: ${id}`);
  return pack;
}

export function listPackIds(): string[] {
  return Object.keys(PACKS);
}
