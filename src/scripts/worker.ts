import { NS } from "@ns";
import { WorkerAction } from "./libs/workers";

export async function main(ns: NS): Promise<void> {
    await ns[ns.args[0] as WorkerAction]();
}
