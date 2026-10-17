import { NS } from "@ns";

const WORKER_SCRIPT = "/scripts/worker.js";
const TARGET_FILE = "/targets.json";

type Target = {
  name: string;
  maxRam: number;
  baseSecurity: number;
  maxMoney: number;
};

export function autocomplete(data: { servers: any; }, args: any) {
  const servers = data.servers;
  return [...servers]; 
}

export async function main(ns: NS): Promise<void> {
    // Load existing targets
    let targets: Target[] = [];
    if (ns.fileExists(TARGET_FILE)) {
        const data = ns.read(TARGET_FILE);
        targets = JSON.parse(data);
    }
    
    const existingNames = new Set(targets.map(t => t.name));
    
    for (const target of ns.args) {
        const serverName = String(target);
        
        if (existingNames.has(serverName)) continue;
        
        ns.nuke(serverName);
        await ns.scp(WORKER_SCRIPT, serverName);
        
        targets.push({
            name: serverName,
            maxRam: ns.getServerMaxRam(serverName),
            baseSecurity: ns.getServerBaseSecurityLevel(serverName),
            maxMoney: ns.getServerMaxMoney(serverName),
        });
        
        ns.tprint(`PWNed: ${serverName}`);
    }
    
    // Write updated targets back
    await ns.write(TARGET_FILE, JSON.stringify(targets, null, 2), "w");
}
