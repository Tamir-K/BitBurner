export const WORKER_PATH = "/scripts/worker.ts";

const WORKER_CONFIGS = {
    weaken: { action: "weaken", ram: 1.75 },
    grow: { action: "grow", ram: 1.75 },
    hack: { action: "hack", ram: 1.7 },
    share: { action: "share", ram: 4 }
} as const;

export function getWorkerConfig(
    currentSecurity: number,
    baseSecurity: number,
    currentMoney: number,
    maxMoney: number,
    config: any,
) {
    if (config.farmXP) return WORKER_CONFIGS.weaken;
    if (config.share) return WORKER_CONFIGS.share;
    if (currentSecurity > baseSecurity) return WORKER_CONFIGS.weaken;
    if (currentMoney < maxMoney) return WORKER_CONFIGS.grow;
    return WORKER_CONFIGS.hack;
}
