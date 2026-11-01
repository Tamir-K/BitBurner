import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    switch (ns.args[0]) {
        case "hack":
            await ns.hack(ns.args[1] as string);
            break;
        case "grow":
            await ns.grow(ns.args[1] as string);
            break;
        case "weaken":
            await ns.weaken(ns.args[1] as string);
            break;
        default:
            ns.tprint(`Unknown action: ${ns.args[0]}`);
    }
}

