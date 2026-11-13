import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[1] as string;
    const additionalMsec = Number(ns.args[2] ?? 0);

    switch (ns.args[0]) {
        case "hack":
            await ns.hack(target, { additionalMsec });
            break;
        case "grow":
            await ns.grow(target, { additionalMsec });
            break;
        case "weaken":
            await ns.weaken(target, { additionalMsec });
            break;
        case "share":
            await ns.share();
            break;
        default:
            ns.tprint(`Unknown action: ${ns.args[0]}`);
    }
}
