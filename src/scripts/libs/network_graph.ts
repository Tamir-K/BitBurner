import { NS } from "@ns";

export type NetworkGraph = { [key: string]: string[] };

function loadGraph(ns: NS): NetworkGraph {
    const data = ns.read("network-graph.json");
    if (!data) {
        throw new Error("Network graph not found. Run /scripts/scan_network.ts first.");
    }
    return JSON.parse(data);
}

export function getAllServers(ns: NS): string[] {
    const graph = loadGraph(ns);
    return Object.keys(graph).filter((node) => node !== "home");
}

export function findPath(ns: NS, target: string): string[] {
    const graph = loadGraph(ns);
    const nodes = Object.keys(graph);

    if (!nodes.includes(target)) {
        return [];
    }

    const visited = new Set<string>();
    const queue: Array<{ node: string; path: string[] }> = [
        { node: "home", path: ["home"] },
    ];

    while (queue.length > 0) {
        const { node, path } = queue.shift()!;

        if (node === target) {
            return path;
        }

        if (visited.has(node)) continue;
        visited.add(node);

        for (const neighbor of graph[node] || []) {
            if (!visited.has(neighbor)) {
                queue.push({ node: neighbor, path: [...path, neighbor] });
            }
        }
    }

    return [];
}
