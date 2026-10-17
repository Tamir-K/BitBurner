import { NS } from "@ns";

const MIN_SECURITY_OFFSET = 0.5;
const MAX_MONEY_PERCENT = 0.9;

export type WorkerAction = "weaken" | "grow" | "hack";

export interface WorkerScript {
    path: string;
    ram: number;
}

export const WORKERS: Record<WorkerAction, WorkerScript> = {
    weaken: {path: "/scripts/weaken.js", ram: 0},
    grow: {path: "/scripts/grow.js", ram: 0},
    hack: {path: "/scripts/hack.js", ram: 0},
};

export async function getWorkerRams(ns: NS): Promise<Record<WorkerAction, number>> {
    const rams: Record<WorkerAction, number> = { weaken: 0, grow: 0, hack: 0 };
    for (const action of Object.keys(rams) as WorkerAction[]) {
        rams[action] = ns.getScriptRam(WORKERS[action].path);
    }
    return rams;
}

export function getAllWorkerPaths(): string[] {
    return Object.values(WORKERS).map((w) => w.path);
}

export function chooseWorker( currentSecurity: number, baseSecurity: number, currentMoney: number, maxMoney: number): WorkerScript {
  if (currentSecurity > baseSecurity + MIN_SECURITY_OFFSET) return WORKERS["weaken"];
  if (currentMoney < maxMoney * MAX_MONEY_PERCENT) return WORKERS["grow"];
  return WORKERS["hack"];
}