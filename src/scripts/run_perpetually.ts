import { NS } from "@ns";
import { sleep } from "./libs/sleep";

export async function main(ns: NS): Promise<void> {
  const scriptPath = ns.args[0] as string;
  const scriptArgs = ns.args.slice(1);

  if (!scriptPath) {
    ns.tprint("ERROR: No script path provided");
    ns.tprint(`Usage: run ${ns.getScriptName()} <path-to-script>`);
    return;
  }

  while (true) {
    ns.run(scriptPath, 1, ...scriptArgs);
    await sleep(ns);
  }
}
