import { NS } from "@ns";
import { WORKER_PATH, WORKER_CONFIGS } from "./libs/workers";
import { readTargets, chooseBestTarget, Target } from "./libs/targets";

const HACK_FRACTION = 0.1; // share of max money stolen per batch
const GAP = 200;           // ms between finish times of consecutive ops

function getHosts(targets: Target[]): string[] {
    return targets.filter(t => t.maxRam > 0).map(t => t.name);
}

function freeRam(ns: NS, hosts: string[]): number {
    return hosts.reduce((sum, h) => sum + ns.getServerMaxRam(h) - ns.getServerUsedRam(h), 0);
}

// Spread `threads` across hosts. Returns false if it could not place them all.
function launch(ns: NS, hosts: string[], action: keyof typeof WORKER_CONFIGS,
    threads: number, target: string, delay: number): boolean {
    const ram = WORKER_CONFIGS[action].ram;
    let remaining = threads;
    for (const host of hosts) {
        if (remaining <= 0) break;
        const fit = Math.floor((ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) / ram);
        const n = Math.min(fit, remaining);
        if (n > 0) {
            ns.exec(WORKER_PATH, host, n, action, target, delay);
            remaining -= n;
        }
    }
    return remaining <= 0;
}

async function prep(ns: NS, target: Target, hosts: string[]): Promise<void> {
    while (true) {
        const sec = ns.getServerSecurityLevel(target.name) - target.baseSecurity;
        const money = ns.getServerMoneyAvailable(target.name);
        if (sec <= 0.001 && money >= target.maxMoney) return;

        const growT = money < target.maxMoney
            ? Math.ceil(ns.growthAnalyze(target.name, target.maxMoney / Math.max(money, 1)))
            : 0;
        const growSec = ns.growthAnalyzeSecurity(growT, target.name);
        const weakT = Math.ceil((Math.max(sec, 0) + growSec) / ns.weakenAnalyze(1));

        if (weakT > 0) launch(ns, hosts, "weaken", weakT, target.name, 0);
        if (growT > 0) launch(ns, hosts, "grow", growT, target.name, 0);
        await ns.sleep(ns.getWeakenTime(target.name) + 200);
    }
}

export async function main(ns: NS): Promise<void> {
    const targets = await readTargets(ns);
    const hosts = getHosts(targets);

    const best = await chooseBestTarget(targets, ns.getHackingLevel() / 4);
    const target = best.name;

    ns.tprint(`Selected target: ${target}`);

    await prep(ns, best, hosts);

    // Timing for one batch (all durations in ms)
    const tH = ns.getHackTime(target);
    const tG = ns.getGrowTime(target);
    const tW = ns.getWeakenTime(target);

    // Thread counts
    const hackPerThread = ns.hackAnalyze(target);
    const hackT = Math.max(1, Math.floor(HACK_FRACTION / hackPerThread));
    const growT = Math.ceil(ns.growthAnalyze(target, 1 / (1 - HACK_FRACTION)));
    const weakenPerThread = ns.weakenAnalyze(1);
    const w1 = Math.ceil(ns.hackAnalyzeSecurity(hackT, target) / weakenPerThread);
    const w2 = Math.ceil(ns.growthAnalyzeSecurity(growT, target) / weakenPerThread);

    const batchRam =
        hackT * WORKER_CONFIGS.hack.ram +
        growT * WORKER_CONFIGS.grow.ram +
        (w1 + w2) * WORKER_CONFIGS.weaken.ram;

    ns.tprint(`Batch for ${target}: H=${hackT} W1=${w1} G=${growT} W2=${w2}, ${batchRam.toFixed(1)} GB`);

    // Finish order: H at tW-GAP, W1 at tW, G at tW+GAP, W2 at tW+2*GAP
    const batchPeriod = 4 * GAP;

    while (true) {
        if (freeRam(ns, hosts) < batchRam) {
            await ns.sleep(batchPeriod);
            continue;
        }
        const ok =
            launch(ns, hosts, "hack", hackT, target, tW - GAP - tH) &&
            launch(ns, hosts, "weaken", w1, target, 0) &&
            launch(ns, hosts, "grow", growT, target, tW + GAP - tG) &&
            launch(ns, hosts, "weaken", w2, target, 2 * GAP);

        if (!ok) ns.print("WARN: batch partially placed (RAM fragmentation)");
        await ns.sleep(batchPeriod);
    }
}
