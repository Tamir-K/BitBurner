import { NS } from "@ns";
import { NetworkGraph } from "./libs/network_graph";

function scanNetworkGraph(ns: NS): any {
    const visited = new Set<string>(["home"]);
    const queue = ["home"];
    const adjacencyList: { [key: string]: string[] } = {};

    while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = ns.scan(current);
        adjacencyList[current] = neighbors;

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }

    return adjacencyList;
}

export async function main(ns: NS): Promise<void> {
    const graph = scanNetworkGraph(ns);
    ns.write("network-graph.json", JSON.stringify(graph, null, 2), "w");
    ns.tprint(`Network scanned. ${Object.keys(graph).length} nodes found.`);
}