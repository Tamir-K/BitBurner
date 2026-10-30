import { NS } from "@ns";

export function autocomplete(data: { servers: any; }, args: any) {
    return data.servers;
}

function dfsScan(ns: NS, server: string, target: string, route: string[], visited = new Set<string>()): boolean {
    if (visited.has(server)) return false;
    visited.add(server);
    route.push(server);

    if (server === target) {
        return true;
    }

    for (const neighbor of ns.scan(server)) {
        if (!visited.has(neighbor) && dfsScan(ns, neighbor, target, route, visited)) {
            return true;
        }
    }

    route.pop();
    return false;
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
    
    let route: string[] = [];
    dfsScan(ns, 'home', server, route);
    ns.tprint(route.join(' -> '))
}
