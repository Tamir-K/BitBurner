import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    await ns[ns.args[0] as "weaken" | "grow" | "hack"]();
}
