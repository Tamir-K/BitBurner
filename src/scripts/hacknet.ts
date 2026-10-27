import { NS } from "@ns";
import { sleep } from "./libs/sleep";

interface UpgradeOption {
  cost: number;
  action: () => boolean;
}

const BUDGET_LIMIT = 0.33;

function getUpgradeOptions(ns: NS, node: number): Array<[number, () => boolean]> {
  return [
    [ns.hacknet.getLevelUpgradeCost(node), () => ns.hacknet.upgradeLevel(node)],
    [ns.hacknet.getRamUpgradeCost(node), () => ns.hacknet.upgradeRam(node)],
    [ns.hacknet.getCoreUpgradeCost(node), () => ns.hacknet.upgradeCore(node)],
    [ns.hacknet.getCacheUpgradeCost(node), () => ns.hacknet.upgradeCache(node)],
  ];
}

function getCheapest(ns: NS): UpgradeOption {
  let cheapest: UpgradeOption = {
    cost: ns.hacknet.getPurchaseNodeCost(),
    action: () => ns.hacknet.purchaseNode() !== -1,
  };

  for (let i = 0; i < ns.hacknet.numNodes(); i++) {
    const options = getUpgradeOptions(ns, i);
    const [cost, action] = options.reduce(([minCost, minAction], [cost, action]) => {
      return cost < minCost ? [cost, action] : [minCost, minAction];
    });

    if (cost < cheapest.cost) cheapest = { cost, action };
  }

  return cheapest;
}

export async function main(ns: NS): Promise<void> {
  while (true) {
    const cheapest = getCheapest(ns);
    while (cheapest.cost > ns.getPlayer().money * BUDGET_LIMIT) await sleep(ns);
    cheapest.action();
  }
}
