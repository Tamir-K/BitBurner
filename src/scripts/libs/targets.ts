import { NS } from "@ns";

export const TARGET_FILE = "/targets.json";

export interface Target {
    name: string;
    maxRam: number;
    baseSecurity: number;
    maxMoney: number;
    hackLevel: number;
}

export async function readTargets(ns: NS): Promise<Target[]> {
    return JSON.parse(ns.read(TARGET_FILE) || "[]") as Target[];
}

export async function writeTargets(ns: NS, targets: Target[]): Promise<void> {
    await ns.write(TARGET_FILE, JSON.stringify(targets, null, 2), "w");
}

export function createTarget(ns: NS, serverName: string): Target {
    return {
        name: serverName,
        maxRam: ns.getServerMaxRam(serverName),
        baseSecurity: ns.getServerBaseSecurityLevel(serverName),
        maxMoney: ns.getServerMaxMoney(serverName),
        hackLevel: ns.getServerRequiredHackingLevel(serverName),
    };
}

function scoreTarget(target: Target): number {
    return target.maxMoney / target.baseSecurity;
}

export async function chooseBestTarget(targets: Target[], hackingLevel: number, config: any): Promise<Target> {
    if (config.farmXP) return targets.filter(target => target.name == 'n00dles')[0];
    return targets.filter(target => target.hackLevel <= hackingLevel).reduce((best, current) => scoreTarget(current) > scoreTarget(best) ? current : best);
}