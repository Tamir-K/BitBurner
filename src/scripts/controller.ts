import { NS } from "@ns";
import { readTargets, Target } from "./libs/targets";
import { sleep } from "./libs/sleep";

const MIN_SECURITY_OFFSET = 0.5;
const MAX_MONEY_PERCENT = 0.9;
const WORKER_PATH = "/scripts/worker.ts";

const WORKER_CONFIGS = {
    weaken: { action: "weaken", ram: 1.75 },
    grow: { action: "grow", ram: 1.75 },
    hack: { action: "hack", ram: 1.7 },
} as const;

function chooseWorker(currentSecurity: number, baseSecurity: number, currentMoney: number, maxMoney: number) {
    if (currentSecurity > baseSecurity + MIN_SECURITY_OFFSET) return WORKER_CONFIGS.weaken;
    if (currentMoney < maxMoney * MAX_MONEY_PERCENT) return WORKER_CONFIGS.grow;
    return WORKER_CONFIGS.hack;
}

function getAvailableRam(ns: NS, server: Target): number {
    return server.maxRam - ns.getServerUsedRam(server.name);
}

function actOnTarget(ns: NS, target: Target) {
    const currentSecurity = ns.getServerSecurityLevel(target.name);
    const currentMoney = ns.getServerMoneyAvailable(target.name);
    const worker = chooseWorker(currentSecurity, target.baseSecurity, currentMoney, target.maxMoney);
    const threads = Math.floor(getAvailableRam(ns, target) / worker.ram);

    if (threads <= 0) return;

    ns.exec(WORKER_PATH, target.name, { "threads": threads, ramOverride: worker.ram }, worker.action);
}

export async function main(ns: NS): Promise<void> {
    while (true) {
        (await readTargets(ns)).forEach(target => actOnTarget(ns, target));
        await sleep(ns);
    }
}
