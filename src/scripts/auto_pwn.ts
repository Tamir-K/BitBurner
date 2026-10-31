import { NS } from "@ns";
import { sleep } from "./libs/sleep";
import { getAllServers } from "./libs/network_graph";


export async function main(ns: NS): Promise<void> {
  ns.rm("targets.json", "home");
  const servers = getAllServers(ns);
  while (true) {
    ns.run("/scripts/pwn.ts", 1, ...servers);
    await sleep(ns);
  }
}
