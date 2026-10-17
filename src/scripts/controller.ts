import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const minSecurityOffset = 0.5;
  const maxMoneyPercent = 0.9;
  const workerScript = "/scripts/worker.js";
  const targetFile = "/targets.json";
  const workerRam = ns.getScriptRam(workerScript);

  const actionMap = (
    currentSecurity: number,
    baseSecurity: number,
    currentMoney: number,
    maxMoney: number
  ): "weaken" | "grow" | "hack" =>
    currentSecurity > baseSecurity + minSecurityOffset
      ? "weaken"
      : currentMoney < maxMoney * maxMoneyPercent
        ? "grow"
        : "hack";


  while (true) {
    const targets = JSON.parse(ns.read(targetFile) || "[]") as {
      name: string;
      maxRam: number;
      baseSecurity: number;
      maxMoney: number;
    }[];

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

      const threads = Math.floor(availableRam / workerRam);

      if (threads > 0) {
        ns.exec(workerScript, target.name, threads, action);
      }
    }

    await ns.sleep(100);
  }
}
