import { NS } from "@ns";
import { getAllServers } from "./libs/network_graph";


function mergeOverlappingIntervals(intervals: number[][]): number[][] {
    if (intervals.length === 0) return [];

    const sorted = intervals
        .map(([start, end]) => [start, end])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    const result: number[][] = [];

    for (const [start, end] of sorted) {
        const last = result[result.length - 1];

        if (last && start <= last[1]) last[1] = Math.max(last[1], end);
        else result.push([start, end]);
    }

    return result;
}

function totalPrimesInRange(range: number[]): number {
    const [low, high] = range;
    if (high < 2) return 0;

    const composite = new Uint8Array(high + 1);
    composite[0] = 1;
    composite[1] = 1;

    for (let i = 2; i * i <= high; i++) {
        if (composite[i] === 0) {
            for (let j = i * i; j <= high; j += i) {
                composite[j] = 1;
            }
        }
    }

    let count = 0;
    for (let n = Math.max(low, 2); n <= high; n++) {
        if (composite[n] === 0) count++;
    }
    return count;
}

function arrayJumpingGame(jumps: readonly number[]): 0 | 1 {
    const n = jumps.length;
    if (n === 0) return 0;
    if (jumps.some(j => !Number.isFinite(j) || j < 0)) {
        throw new RangeError("Jump lengths must be non-negative finite numbers");
    }

    let farthest = 0;
    for (let i = 0; i <= farthest && i < n; i++) {
        farthest = Math.max(farthest, i + jumps[i]);
        if (farthest >= n - 1) return 1;
    }
    return 0;
}

function generateIPAddresses(s: string): string[] {
    const parts = 4, maxValue = 255;
    const results: string[] = [];
    if (!/^\d+$/.test(s)) return results;

    const maxLen = String(maxValue).length;

    const backtrack = (start: number, chosen: string[]): void => {
        const remainingParts = parts - chosen.length;
        const remainingChars = s.length - start;

        if (remainingParts === 0) {
            if (remainingChars === 0) results.push(chosen.join("."));
            return;
        }

        if (remainingChars < remainingParts || remainingChars > remainingParts * maxLen) return;

        for (let len = 1; len <= maxLen && start + len <= s.length; len++) {
            const segment = s.slice(start, start + len);

            if (len > 1 && segment[0] === "0") break;

            if (Number(segment) > maxValue) break;

            backtrack(start + len, [...chosen, segment]);
        }
    };

    backtrack(0, []);
    return results;
}

export function subarrayWithMaximumSum(values: readonly number[]): number | undefined {
    if (values.length === 0) return undefined;

    let best = values[0];
    let cur = values[0];

    for (let i = 1; i < values.length; i++) {
        cur = Math.max(values[i], cur + values[i]);
        best = Math.max(best, cur);
    }

    return best;
}

export async function main(ns: NS): Promise<void> {
    const solvers: Partial<Record<string, (data: any) => unknown>> = {
        [ns.enums.CodingContractName.SubarrayWithMaximumSum]: subarrayWithMaximumSum,
        [ns.enums.CodingContractName.ArrayJumpingGame]: arrayJumpingGame,
        [ns.enums.CodingContractName.MergeOverlappingIntervals]: mergeOverlappingIntervals,
        [ns.enums.CodingContractName.GenerateIPAddresses]: generateIPAddresses,
        [ns.enums.CodingContractName.TotalPrimesInRange]: totalPrimesInRange,
    };

    for (const server of getAllServers(ns)) {
        for (const contract of ns.ls(server, ".cct")) {
            const type = ns.codingcontract.getContractType(contract, server);
            const solver = solvers[type];
            if (!solver) continue;

            const answer = solver(ns.codingcontract.getData(contract, server));
            const solved = ns.codingcontract.attempt(answer as any, contract, server);
            ns.tprint(`${solved ? "Solved" : "Failed"}: ${type} (${contract} on ${server})`);
        }
    }
}
