import { NS } from "@ns";
import { readTargets, createTarget, writeTargets } from "./libs/targets";
import { getAllWorkerPaths } from "./libs/workers";

export function autocomplete(data: { servers: any; }, args: any) {
  const servers = data.servers;
  return [...servers]; 
}

function pwn_server(ns: NS, serverName: string) {
    if(ns.fileExists("BruteSSH.exe")) ns.brutessh(serverName);
    ns.nuke(serverName);
}

export async function main(ns: NS): Promise<void> {
    let targets = await readTargets(ns);
    const existingNames = new Set(targets.map(t => t.name));
    
    for (const target of ns.args) {
        const serverName = String(target);
        if (existingNames.has(serverName)) continue;
        pwn_server(ns, serverName);
        
        for (const script of getAllWorkerPaths()) await ns.scp(script, serverName);
        
        targets.push(createTarget(ns, serverName));
        ns.tprint(`PWNed: ${serverName}`);
    }
    
    writeTargets(ns, targets);
}
