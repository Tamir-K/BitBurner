import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const [action] = ns.args;

  if (action === "hack") {
    await ns.hack();
  } else if (action === "grow") {
    await ns.grow();
  } else if (action === "weaken") {
    await ns.weaken();
  }
}
