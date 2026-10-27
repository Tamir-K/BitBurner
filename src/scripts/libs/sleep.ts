import { NS } from "@ns";

const SLEEP_MS = 100;

export async function sleep(ns: NS): Promise<void> {
    await ns.sleep(SLEEP_MS);
}
