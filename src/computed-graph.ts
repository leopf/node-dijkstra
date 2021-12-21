import { CostMap, DeepMapKey, PreviousMap } from "./types";
import { findPath } from "./util";

export interface IOTAPathOptions {
    cost?: boolean;
    trim?: boolean;
    reverse?: boolean;
}

export class ComputedGraph {
    private previousMap: PreviousMap;
    private costMap: CostMap;
    private start: DeepMapKey;

    constructor(start: DeepMapKey, previousMap: PreviousMap, costMap: CostMap) {
        this.previousMap = previousMap;
        this.costMap = costMap;
        this.start = start;
    }

    public path(goal: DeepMapKey, options: IOTAPathOptions = {}): DeepMapKey[] | { path: DeepMapKey[] | null; cost: number; } | null {
        // Return null when no path can be found
        if (!this.previousMap.has(goal)) {
            if (options.cost) {
                return {
                    path: null,
                    cost: 0
                };
            }

            return null;
        }

        // Set the total cost to the current value
        const totalCost = this.costMap.get(goal);
        let path = [ ...findPath(this.previousMap, goal), this.start ];

        // From now on, keep in mind that `path` is populated in reverse order,
        // from destination to origin

        // Remove the first value (the goal node) if we want a trimmed result
        if (options.trim) {
            path.shift();
        }

        // Reverse the path if we don't want it reversed, so the result will be
        // from `start` to `goal`
        if (!options.reverse) {
            path = path.reverse();
        }

        // Return an object if we also want the cost
        if (options.cost) {
            return {
                path: path,
                cost: totalCost!,
            };
        }

        return path;
    }
}