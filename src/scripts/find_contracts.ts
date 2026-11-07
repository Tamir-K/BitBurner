import { NS } from "@ns";
import { getAllServers } from "./libs/network_graph";

export async function main(ns: NS): Promise<void> {
    for (const server of getAllServers(ns)) {
        const contracts = ns.ls(server, ".cct");
        if (!contracts.length) continue;
        ns.tprint(`${server}: ${contracts.join(' ')}`)
    }
}
