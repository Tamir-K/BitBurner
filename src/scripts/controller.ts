import { NS } from "@ns";

const MIN_SECURITY_OFFSET = 0.5;
const MAX_MONEY_PERCENT = 0.9;
const SLEEP_MS = 100;

interface WorkerAction {
  script: string;
  ram: number;
}

interface Target {
  name: string;
  maxRam: number;
  baseSecurity: number;
  maxMoney: number;
}

const ACTIONS: Record<"weaken" | "grow" | "hack", WorkerAction> = {
  weaken: {script: "/scripts/weaken.js", ram: 0},
  grow: {script: "/scripts/grow.js", ram: 0},
  hack: {script: "/scripts/hack.js", ram: 0},
};

const TARGET_FILE = "/targets.json";

export async function main(ns: NS): Promise<void> {
  // Populate RAM costs
  ACTIONS.weaken.ram = ns.getScriptRam(ACTIONS.weaken.script);
  ACTIONS.grow.ram = ns.getScriptRam(ACTIONS.grow.script);
  ACTIONS.hack.ram = ns.getScriptRam(ACTIONS.hack.script);

  const actionMap = (
    currentSecurity: number,
    baseSecurity: number,
    currentMoney: number,
    maxMoney: number
  ): WorkerAction =>
    currentSecurity > baseSecurity + MIN_SECURITY_OFFSET
      ? ACTIONS.weaken
      : currentMoney < maxMoney * MAX_MONEY_PERCENT
        ? ACTIONS.grow
        : ACTIONS.hack;

  while (true) {
    const targets = JSON.parse(ns.read(TARGET_FILE) || "[]") as Target[];

    for (const target of targets) {
      const usedRam = ns.getServerUsedRam(target.name);
      const availableRam = target.maxRam - usedRam;

      const currentSecurity = ns.getServerSecurityLevel(target.name);
      const currentMoney = ns.getServerMoneyAvailable(target.name);

      const action = actionMap(
        currentSecurity,
        target.baseSecurity,
        currentMoney,
        target.maxMoney
      );

      const threads = Math.floor(availableRam / action.ram);

      if (threads > 0) ns.exec(action.script, target.name, threads);
    }

    await ns.sleep(SLEEP_MS);
  }
}
