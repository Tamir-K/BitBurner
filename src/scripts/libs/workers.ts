const MIN_SECURITY_OFFSET = 0.5;
const MAX_MONEY_PERCENT = 0.9;

export type WorkerAction = "weaken" | "grow" | "hack";

export interface WorkerScript {
    path: string;
    ram: number;
}

export const WORKERS: Record<WorkerAction, WorkerScript> = {
    weaken: {path: "/scripts/weaken.js", ram: 1.75},
    grow: {path: "/scripts/grow.js", ram: 1.75},
    hack: {path: "/scripts/hack.js", ram: 1.7},
};

export function getAllWorkerPaths(): string[] {
    return Object.values(WORKERS).map((w) => w.path);
}

export function chooseWorker(currentSecurity: number, baseSecurity: number, currentMoney: number, maxMoney: number): WorkerScript {
  if (currentSecurity > baseSecurity + MIN_SECURITY_OFFSET) return WORKERS["weaken"];
  if (currentMoney < maxMoney * MAX_MONEY_PERCENT) return WORKERS["grow"];
  return WORKERS["hack"];
}
