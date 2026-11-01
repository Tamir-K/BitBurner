import { NS } from "@ns";
import { readTargets, Target } from "./libs/targets";
import { sleep } from "./libs/sleep";
import { getWorkerConfig, WORKER_PATH } from "./libs/workers";

function getAvailableRam(ns: NS, server: Target): number {
    return server.maxRam - ns.getServerUsedRam(server.name);
}

function actOnTarget(ns: NS, target: Target) {
    const currentSecurity = ns.getServerSecurityLevel(target.name);
    const currentMoney = ns.getServerMoneyAvailable(target.name);
    const worker = getWorkerConfig(currentSecurity, target.baseSecurity, currentMoney, target.maxMoney);
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
