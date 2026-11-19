import { NS } from "@ns";
import { WORKER_PATH, WORKER_CONFIGS } from "./libs/workers";
import { readTargets, chooseBestTarget, Target, TARGET_FILE } from "./libs/targets";

const HACK_FRACTION = 0.1; // max share of money stolen per batch
const GAP = 200;           // ms between finish times of consecutive ops

type Op = { action: keyof typeof WORKER_CONFIGS; threads: number; delay: number };
type Spot = { host: string; op: Op; threads: number };

// Greedily spread ops across hosts. Pure: does not launch anything.
// strict: return undefined unless every thread fits; otherwise place what fits.
function place(ns: NS, hosts: Target[], ops: readonly Op[], strict = true): Spot[] | undefined {
    const free = hosts.map(h => h.maxRam - ns.getServerUsedRam(h.name));
    const spots: Spot[] = [];
    for (const op of ops) {
        const ram = WORKER_CONFIGS[op.action].ram;
        let remaining = op.threads;
        for (let i = 0; i < free.length && remaining > 0; i++) {
            const n = Math.min(Math.floor(free[i] / ram), remaining);
            if (n > 0) {
                free[i] -= n * ram;
                remaining -= n;
                spots.push({ host: hosts[i].name, op, threads: n });
            }
        }
        if (remaining > 0 && strict) return undefined;
    }
    return spots;
}

function start(ns: NS, name: string, spots: Spot[]): void {
    for (const { host, op, threads } of spots)
        ns.exec(WORKER_PATH, host, { threads, ramOverride: WORKER_CONFIGS[op.action].ram }, op.action, name, op.delay);
}

// HWGW batch stealing `fraction` of the target's money.
function batch(ns: NS, target: Target, fraction: number): Op[] {
    const tH = ns.getHackTime(target.name);
    const tG = ns.getGrowTime(target.name);
    const tW = ns.getWeakenTime(target.name);
    const wA = ns.weakenAnalyze(1);

    const hackT = Math.max(1, Math.floor(fraction / ns.hackAnalyze(target.name)));
    const growT = Math.max(1, Math.ceil(ns.growthAnalyze(target.name, 1 / (1 - fraction))));
    const wH = Math.ceil(ns.hackAnalyzeSecurity(hackT, target.name) / wA);
    const wG = Math.ceil(ns.growthAnalyzeSecurity(growT, target.name) / wA);

    // Finish order: H at tW-GAP, wH at tW, G at tW+GAP, wG at tW+2*GAP
    return [
        { action: "hack", threads: hackT, delay: tW - GAP - tH },
        { action: "weaken", threads: wH, delay: 0 },
        { action: "grow", threads: growT, delay: tW + GAP - tG },
        { action: "weaken", threads: wG, delay: 2 * GAP },
    ];
}

// Place the largest batch that fits, capped at `maxFraction`. Uses actual host
// placement, so per-host rounding and fragmentation are respected.
function plan(ns: NS, hosts: Target[], target: Target, maxFraction: number): Spot[] | undefined {
    const placeAt = (fraction: number) => place(ns, hosts, batch(ns, target, fraction));

    const full = placeAt(maxFraction);
    if (full) return full;

    let lo = 0;
    let hi = maxFraction;
    let best: Spot[] | undefined;
    for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2;
        const spots = placeAt(mid);
        if (spots) {
            lo = mid;
            best = spots;
        } else {
            hi = mid;
        }
    }
    return best;
}

async function prep(ns: NS, target: Target, hosts: Target[]): Promise<void> {
    const wA = ns.weakenAnalyze(1);
    while (true) {
        const sec = ns.getServerSecurityLevel(target.name) - target.baseSecurity;
        const money = ns.getServerMoneyAvailable(target.name);
        if (sec <= 0.001 && money >= target.maxMoney) return;

        // Wipe security first; then grow, covering only that grow's security cost.
        // Never budget weaken threads for a grow that may not fit — that starves
        // grow and loops on weaken forever. Grow is placed first, so it wins RAM.
        const ops: Op[] = [];
        if (sec > 0.001) {
            ops.push({ action: "weaken", threads: Math.ceil(sec / wA), delay: 0 });
        } else {
            const growT = Math.ceil(ns.growthAnalyze(target.name, target.maxMoney / Math.max(money, 1)));
            ops.push(
                { action: "grow", threads: growT, delay: 0 },
                { action: "weaken", threads: Math.ceil(ns.growthAnalyzeSecurity(growT, target.name) / wA), delay: 0 },
            );
        }

        start(ns, target.name, place(ns, hosts, ops, false) ?? []);
        await ns.sleep(ns.getWeakenTime(target.name) + 200);
    }
}

export function autocomplete(data: { servers: string[] }): string[] {
    return data.servers;
}

export async function main(ns: NS): Promise<void> {
    let targets = await readTargets(ns);
    // Optional arg: hostname to target. Omitted → best target from targets.json.
    const targetName = ns.args[0] as string | undefined;
    const target = targetName
        ? targets.find(t => t.name === targetName)
        : await chooseBestTarget(targets, Math.ceil(ns.getHackingLevel() / 8));
    if (!target) return ns.tprint(`Target '${targetName}' not in ${TARGET_FILE}; run the target scanner first.`);

    ns.tprint(`Selected target: ${target.name}`);

    await prep(ns, target, targets);

    while (true) {
        // Re-read each loop so servers rooted after startup join the RAM pool.
        targets = await readTargets(ns);
        const spots = plan(ns, targets, target, HACK_FRACTION);
        if (spots) start(ns, target.name, spots);
        await ns.sleep(4 * GAP);
    }
}
