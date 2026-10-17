import { NS } from "@ns";

export function autocomplete(data: { servers: any; }, args: any) {
  const servers = data.servers;
  return [...servers]; 
}

export async function main(ns: NS): Promise<void> {
    for (const target of ns.args) {
        const serverName = String(target);
        ns.nuke(serverName);
        ns.tprint(`Nuked: ${serverName}`);
    }
}