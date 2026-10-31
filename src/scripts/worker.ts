import { NS } from "@ns";
import { WorkerAction, WORKERS } from "./libs/workers";

export async function main(ns: NS): Promise<void> {
    await WORKERS[ns.args[0] as WorkerAction].run(ns);
}