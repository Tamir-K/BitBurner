import { NS } from "@ns";
import { readTargets, createTarget, writeTargets } from "./libs/targets";
import { getAllWorkerPaths } from "./libs/workers";

export function autocomplete(data: { servers: any; }, args: any) {
    const servers = data.servers;
    return [...servers];
}

function getCracks(ns: NS) {
    return {
        "BruteSSH.exe": ns.brutessh,
        "FTPCrack.exe": ns.ftpcrack,
        "relaySMTP.exe": ns.relaysmtp,
        "HTTPWorm.exe": ns.httpworm,
        "SQLInject.exe": ns.sqlinject,
        "NUKE.exe": ns.nuke
    };
}

function pwn_server(ns: NS, serverName: string) {
    for (const [file, program] of Object.entries(getCracks(ns))) {
        if (ns.fileExists(file)) program(serverName);
    }
}

export async function main(ns: NS): Promise<void> {
    let targets = await readTargets(ns);
    const existingNames = new Set(targets.map(t => t.name));

    for (const target of ns.args.map(arg => String(arg))) {
        if (existingNames.has(target)) continue;
        if (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(target)) continue;
        pwn_server(ns, target);

        if (ns.hasRootAccess(target)) {
            for (const script of getAllWorkerPaths()) await ns.scp(script, target);
            targets.push(createTarget(ns, target));
            ns.tprint(`PWNed: ${target}`);
        }
    }

    writeTargets(ns, targets);
}
