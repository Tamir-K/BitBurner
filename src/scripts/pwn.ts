import { NS } from "@ns";

export function autocomplete(data: { servers: any; }, args: any) {
  const servers = data.servers;
  return [...servers]; 
}

export async function main(ns: NS): Promise<void> {
    const workerScript = "/scripts/worker.js";
    
    for (const target of ns.args) {
        const serverName = String(target);
        ns.nuke(serverName);
        await ns.scp(workerScript, serverName);
        ns.tprint(`PWNed: ${serverName}`);
    }
}