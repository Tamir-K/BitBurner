const MIN_SECURITY_OFFSET = 0.5;
const MAX_MONEY_PERCENT = 0.9;

export type WorkerAction = "weaken" | "grow" | "hack";

export const WORKER_PATH = "/scripts/worker.ts";
export const WORKER_RAM_COSTS: Record<WorkerAction, number> = { weaken: 1.75, grow: 1.75, hack: 1.7 };

export function chooseWorker(currentSecurity: number, baseSecurity: number, currentMoney: number, maxMoney: number): WorkerAction {
    if (currentSecurity > baseSecurity + MIN_SECURITY_OFFSET) return "weaken";
    if (currentMoney < maxMoney * MAX_MONEY_PERCENT) return "grow";
    return "hack";
}
