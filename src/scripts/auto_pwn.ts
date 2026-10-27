import { NS } from "@ns";

function scanNetwork(ns: NS): string[] {
  const visited = new Set<string>(["home"]);
  const queue = ["home"];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const neighbor of ns.scan(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return [...visited];
}

export async function main(ns: NS): Promise<void> {
  ns.rm("targets.json", "home");

  const servers = scanNetwork(ns).filter((server) => server !== "home");

  while (true) {
    ns.run("/scripts/pwn.js", 1, ...servers);
    await ns.sleep(60_000);
  }
}
