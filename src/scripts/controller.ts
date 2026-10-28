import { NS } from "@ns";
import { readTargets, Target } from "./libs/targets";
import { chooseWorker } from "./libs/workers";
import { sleep } from "./libs/sleep";

function actOnTarget(ns: NS, target: Target) {  
  const availableRam = target.maxRam - ns.getServerUsedRam(target.name);
  const currentSecurity = ns.getServerSecurityLevel(target.name);
  const currentMoney = ns.getServerMoneyAvailable(target.name);
  const action = chooseWorker(currentSecurity, target.baseSecurity, currentMoney, target.maxMoney);
  const threads = Math.floor(availableRam / action.ram);

  if (threads <= 0) return;

  ns.exec(action.path, target.name, threads);
}

export async function main(ns: NS): Promise<void> {
  while (true) {
    (await readTargets(ns)).forEach(target => actOnTarget(ns, target));
    await sleep(ns);
  }
}
