import { NS } from "@ns";

type Target = {
  name: string;
  maxRam: number;
  baseSecurity: number;
  maxMoney: number;
};

export async function main(ns: NS): Promise<void> {
  const targetFile = "/targets.json";
  const targets: Target[] = [];
  const queue: string[] = ["home"];
  const visited = new Set<string>();

  // BFS to find all rooted servers
  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    if (ns.hasRootAccess(current) && current !== "home") {
      targets.push({
        name: current,
        maxRam: ns.getServerMaxRam(current),
        baseSecurity: ns.getServerBaseSecurityLevel(current),
        maxMoney: ns.getServerMaxMoney(current),
      });
    }

    queue.push(...ns.scan(current));
  }

  await ns.write(targetFile, JSON.stringify(targets, null, 2), "w");

  ns.tprint(`Found ${targets.length} targets`);
}
