import { NS } from "@ns";

const MIN_SECURITY_OFFSET = 0.5;
const MAX_MONEY_PERCENT = 0.9;
export const WORKER_PATH = "/scripts/worker.ts";
export const WORKERS = {
    weaken: {
        ram: 1.75,
        run: (ns: NS) => ns.weaken(),
    },
    grow: {
        ram: 1.75,
        run: (ns: NS) => ns.grow(),
    },
    hack: {
        ram: 1.7,
        run: (ns: NS) => ns.hack(),
    },
} as const;

export type WorkerAction = keyof typeof WORKERS;

export function chooseWorker(currentSecurity: number, baseSecurity: number, currentMoney: number, maxMoney: number): WorkerAction {
    if (currentSecurity > baseSecurity + MIN_SECURITY_OFFSET) return "weaken";
    if (currentMoney < maxMoney * MAX_MONEY_PERCENT) return "grow";
    return "hack";
}
