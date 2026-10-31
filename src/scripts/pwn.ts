import { NS } from "@ns";
import { readTargets, createTarget, writeTargets } from "./libs/targets";
import { WORKER_PATH } from "./libs/workers";
import { getAllServers } from "./libs/network_graph";

export function autocomplete(data: { servers: any; }, args: any) {
    return data.servers;
}

function canCrackServer(ns: NS, serverName: string): boolean {
    return ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(serverName);
}

function crackServer(ns: NS, serverName: string): void {
    ns.brutessh(serverName);
    ns.ftpcrack(serverName);
    ns.relaysmtp(serverName);
    ns.httpworm(serverName);
    ns.sqlinject(serverName);
    ns.nuke(serverName);
}

export async function main(ns: NS): Promise<void> {
    const args = ns.flags([['a', false]])
    const servers = args["a"] ? getAllServers(ns) : ns.args as string[]
    let targets = await readTargets(ns);
    const existingNames = new Set(targets.map(t => t.name));

    for (const server of servers) {
        if (existingNames.has(server)) continue;
        if (!canCrackServer(ns, server)) continue;

        crackServer(ns, server);
        await ns.scp(WORKER_PATH, server);

        if (ns.hasRootAccess(server)) {
            targets.push(createTarget(ns, server));
            ns.tprint(`PWNed: ${server}`);
        }
    }

    writeTargets(ns, targets);
}
