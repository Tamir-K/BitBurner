import { NS } from "@ns";
import { WorkerAction } from "./libs/workers";

export async function main(ns: NS): Promise<void> {
    const arg = ns.args[0] as WorkerAction;
    switch (arg) {
        case "hack":
            await ns.hack();
            break;
        case "grow":
            await ns.grow();
            break;
        case "weaken":
            await ns.weaken();
            break;
    }
}