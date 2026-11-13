export const WORKER_PATH = "/scripts/worker.ts";

export const WORKER_CONFIGS = {
    weaken: { action: "weaken", ram: 1.75 },
    grow: { action: "grow", ram: 1.75 },
    hack: { action: "hack", ram: 1.7 },
    share: { action: "share", ram: 4 }
} as const;
