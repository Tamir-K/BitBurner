import { NS } from "@ns";
import { findPath } from "./libs/network_graph";

export function autocomplete(data: { servers: any; }, args: any) {
    return data.servers;
}

export async function main(ns: NS): Promise<void> {
    const server = ns.args[0] as string;
    if (!server) {
        ns.tprint("This script helps you find a server on the network and shows you the path to get to it.");
        ns.tprint(`Usage: run ${ns.getScriptName()} SERVER`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} n00dles`);
        return;
    }
    
    ns.tprint(findPath(ns, server).join(' -> '))
}
