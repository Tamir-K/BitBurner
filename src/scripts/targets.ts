import { NS } from "@ns";

export const TARGET_FILE = "/targets.json";

export interface Target {
  name: string;
  maxRam: number;
  baseSecurity: number;
  maxMoney: number;
}

export async function readTargets(ns: NS): Promise<Target[]> {
  if (!ns.fileExists(TARGET_FILE)) return [];
  const data = ns.read(TARGET_FILE);
  return JSON.parse(data) as Target[];
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
  };
}
