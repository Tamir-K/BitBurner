import { NS } from "@ns";
import { WORKER_PATH, WORKER_CONFIGS } from "./libs/workers";
import { readTargets, chooseBestTarget, Target } from "./libs/targets";

const HACK_FRACTION = 0.1; // share of max money stolen per batch
const GAP = 200;           // ms between finish times of consecutive ops

// Re-read each loop so servers rooted after startup join the RAM pool.
// [] on a torn read → canPlace fails → retry next period, never a bad batch.
async function hostList(ns: NS): Promise<string[]> {
    try {
        return (await readTargets(ns)).filter(t => t.maxRam > 0).map(t => t.name);
    } catch {
        return [];
    }
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
            ns.exec(WORKER_PATH, host, { threads: n, ramOverride: ram }, action, target, delay);
            remaining -= n;
        }
    }
    return remaining <= 0;
}

// Mirror launch()'s greedy placement against per-host free RAM. Exact, not heuristic.
function canPlace(ns: NS, hosts: string[], ops: { threads: number; ram: number }[]): boolean {
    const free = hosts.map(h => ns.getServerMaxRam(h) - ns.getServerUsedRam(h));
    for (const { threads, ram } of ops) {
        let remaining = threads;
        for (let i = 0; i < free.length && remaining > 0; i++) {
            const n = Math.min(Math.floor(free[i] / ram), remaining);
            free[i] -= n * ram;
            remaining -= n;
        }
        if (remaining > 0) return false;
    }
    return true;
}

async function prep(ns: NS, target: Target, hosts: string[]): Promise<void> {
    while (true) {
        const sec = ns.getServerSecurityLevel(target.name) - target.baseSecurity;
        const money = ns.getServerMoneyAvailable(target.name);
        if (sec <= 0.001 && money >= target.maxMoney) return;

        const growT = Math.ceil(ns.growthAnalyze(target.name, target.maxMoney / Math.max(money, 1)));
        const growSec = ns.growthAnalyzeSecurity(growT, target.name);
        const weakT = Math.ceil((sec + growSec) / ns.weakenAnalyze(1));

        if (weakT > 0) launch(ns, hosts, "weaken", weakT, target.name, 0);
        if (growT > 0) launch(ns, hosts, "grow", growT, target.name, 0);
        await ns.sleep(ns.getWeakenTime(target.name) + 200);
    }
}

export async function main(ns: NS): Promise<void> {
    const targets = await readTargets(ns);

    const best = await chooseBestTarget(targets, Math.ceil(ns.getHackingLevel() / 8));
    const target = best.name;

    ns.tprint(`Selected target: ${target}`);

    await prep(ns, best, await hostList(ns));

    // Timing for one batch (all durations in ms)
    const tH = ns.getHackTime(target);
    const tG = ns.getGrowTime(target);
    const tW = ns.getWeakenTime(target);

    // Thread counts
    const hackPerThread = ns.hackAnalyze(target);
    const hackT = Math.max(1, Math.floor(HACK_FRACTION / hackPerThread));
    const growT = Math.ceil(ns.growthAnalyze(target, 1 / (1 - HACK_FRACTION)));
    const weakenPerThread = ns.weakenAnalyze(1);
    const wH = Math.ceil(ns.hackAnalyzeSecurity(hackT, target) / weakenPerThread);
    const wG = Math.ceil(ns.growthAnalyzeSecurity(growT, target) / weakenPerThread);

    const batchRam =
        hackT * WORKER_CONFIGS.hack.ram +
        growT * WORKER_CONFIGS.grow.ram +
        (wH + wG) * WORKER_CONFIGS.weaken.ram;

    ns.tprint(`Batch for ${target}: H=${hackT} wH=${wH} G=${growT} wG=${wG}, ${batchRam.toFixed(1)} GB`);

    // Finish order: H at tW-GAP, wH at tW, G at tW+GAP, wG at tW+2*GAP
    const batchPeriod = 4 * GAP;
    const ops = [
        { threads: hackT, ram: WORKER_CONFIGS.hack.ram },
        { threads: wH, ram: WORKER_CONFIGS.weaken.ram },
        { threads: growT, ram: WORKER_CONFIGS.grow.ram },
        { threads: wG, ram: WORKER_CONFIGS.weaken.ram },
    ];

    while (true) {
        const hosts = await hostList(ns);
        if (canPlace(ns, hosts, ops)) {
            launch(ns, hosts, "hack", hackT, target, tW - GAP - tH);
            launch(ns, hosts, "weaken", wH, target, 0);
            launch(ns, hosts, "grow", growT, target, tW + GAP - tG);
            launch(ns, hosts, "weaken", wG, target, 2 * GAP);
        }
        await ns.sleep(batchPeriod);
    }
}
