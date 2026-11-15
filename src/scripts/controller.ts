import { NS } from "@ns";
import { WORKER_PATH, WORKER_CONFIGS } from "./libs/workers";
import { readTargets, chooseBestTarget, createTarget, Target } from "./libs/targets";

const HACK_FRACTION = 0.1; // share of max money stolen per batch
const GAP = 200;           // ms between finish times of consecutive ops

type Op = { action: keyof typeof WORKER_CONFIGS; threads: number; delay: number };

// Re-read each loop so servers rooted after startup join the RAM pool.
// [] on a torn read → schedule places nothing → retry next period, never a bad batch.
async function hostList(ns: NS): Promise<string[]> {
    try {
        return (await readTargets(ns)).filter(t => t.maxRam > 0).map(t => t.name);
    } catch {
        return [];
    }
}

// Greedily spread ops across hosts. strict: run nothing unless every op fits.
function schedule(ns: NS, hosts: string[], target: string, ops: readonly Op[], strict = true): void {
    const free = hosts.map(h => ns.getServerMaxRam(h) - ns.getServerUsedRam(h));
    const placed: { host: string; op: Op; threads: number }[] = [];
    for (const op of ops) {
        const ram = WORKER_CONFIGS[op.action].ram;
        let remaining = op.threads;
        for (let i = 0; i < free.length && remaining > 0; i++) {
            const n = Math.min(Math.floor(free[i] / ram), remaining);
            if (n > 0) {
                free[i] -= n * ram;
                remaining -= n;
                placed.push({ host: hosts[i], op, threads: n });
            }
        }
        if (remaining > 0 && strict) return;
    }
    for (const { host, op, threads } of placed)
        ns.exec(WORKER_PATH, host, { threads, ramOverride: WORKER_CONFIGS[op.action].ram }, op.action, target, op.delay);
}

async function prep(ns: NS, target: Target, hosts: string[]): Promise<void> {
    const name = target.name;
    const wA = ns.weakenAnalyze(1);
    while (true) {
        const sec = ns.getServerSecurityLevel(name) - target.baseSecurity;
        const money = ns.getServerMoneyAvailable(name);
        if (sec <= 0.001 && money >= target.maxMoney) return;

        // Wipe security first; then grow, covering only that grow's security cost.
        // Never budget weaken threads for a grow that may not fit — that starves
        // grow and loops on weaken forever. Grow is placed first, so it wins RAM.
        const ops: Op[] = [];
        if (sec > 0.001) {
            ops.push({ action: "weaken", threads: Math.ceil(sec / wA), delay: 0 });
        } else {
            const growT = Math.ceil(ns.growthAnalyze(name, target.maxMoney / Math.max(money, 1)));
            ops.push(
                { action: "grow", threads: growT, delay: 0 },
                { action: "weaken", threads: Math.ceil(ns.growthAnalyzeSecurity(growT, name) / wA), delay: 0 },
            );
        }

        schedule(ns, hosts, name, ops, false);
        await ns.sleep(ns.getWeakenTime(name) + 200);
    }
}

export function autocomplete(data: { servers: string[] }): string[] {
    return data.servers;
}

export async function main(ns: NS): Promise<void> {
    // Optional arg: hostname to target. Omitted → best target from targets.json.
    const targetName = ns.args[0] as string | undefined;
    const best = targetName
        ? createTarget(ns, targetName)
        : await chooseBestTarget(await readTargets(ns), Math.ceil(ns.getHackingLevel() / 8));
    const target = best.name;

    ns.tprint(`Selected target: ${target}`);

    await prep(ns, best, await hostList(ns));

    const tH = ns.getHackTime(target);
    const tG = ns.getGrowTime(target);
    const tW = ns.getWeakenTime(target);
    const wA = ns.weakenAnalyze(1);

    const hackT = Math.max(1, Math.floor(HACK_FRACTION / ns.hackAnalyze(target)));
    const growT = Math.ceil(ns.growthAnalyze(target, 1 / (1 - HACK_FRACTION)));
    const wH = Math.ceil(ns.hackAnalyzeSecurity(hackT, target) / wA);
    const wG = Math.ceil(ns.growthAnalyzeSecurity(growT, target) / wA);

    // Finish order: H at tW-GAP, wH at tW, G at tW+GAP, wG at tW+2*GAP
    const ops: Op[] = [
        { action: "hack", threads: hackT, delay: tW - GAP - tH },
        { action: "weaken", threads: wH, delay: 0 },
        { action: "grow", threads: growT, delay: tW + GAP - tG },
        { action: "weaken", threads: wG, delay: 2 * GAP },
    ];
    const batchRam = ops.reduce((sum, op) => sum + op.threads * WORKER_CONFIGS[op.action].ram, 0);
    ns.tprint(`Batch for ${target}: H=${hackT} wH=${wH} G=${growT} wG=${wG}, ${batchRam.toFixed(1)} GB`);

    while (true) {
        schedule(ns, await hostList(ns), target, ops);
        await ns.sleep(4 * GAP);
    }
}
