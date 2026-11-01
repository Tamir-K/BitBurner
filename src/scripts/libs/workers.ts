import { config } from "../config";

export const WORKER_PATH = "/scripts/worker.ts";

const WORKER_CONFIGS = {
    weaken: { action: "weaken", ram: 1.75 },
    grow: { action: "grow", ram: 1.75 },
    hack: { action: "hack", ram: 1.7 },
    share: { action: "share", ram: 4 }
} as const;
const MIN_SECURITY_OFFSET = 0.5;
const MAX_MONEY_PERCENT = 0.9;

export function getWorkerConfig(
    currentSecurity: number,
    baseSecurity: number,
    currentMoney: number,
    maxMoney: number
) {
    if (config.share) return WORKER_CONFIGS.share;
    if (currentSecurity > baseSecurity + MIN_SECURITY_OFFSET) return WORKER_CONFIGS.weaken;
    if (currentMoney < maxMoney * MAX_MONEY_PERCENT) return WORKER_CONFIGS.grow;
    return WORKER_CONFIGS.hack;
}
