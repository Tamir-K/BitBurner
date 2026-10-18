import { NS } from "@ns";
import { readTargets } from "./libs/targets";
import { WORKERS, chooseWorker } from "./libs/workers";

const SLEEP_MS = 100;

export async function main(ns: NS): Promise<void> {
  while (true) {
    const targets = await readTargets(ns);

    for (const target of targets) {
      const usedRam = ns.getServerUsedRam(target.name);
      const availableRam = target.maxRam - usedRam;

      const currentSecurity = ns.getServerSecurityLevel(target.name);
      const currentMoney = ns.getServerMoneyAvailable(target.name);

      const action = chooseWorker(currentSecurity, target.baseSecurity, currentMoney, target.maxMoney);

      const threads = Math.floor(availableRam / action.ram);

      if (threads > 0) ns.exec(action.path, target.name, threads);
    }

    await ns.sleep(SLEEP_MS);
  }
}
