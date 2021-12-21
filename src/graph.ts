import { DeepMapSourceCostMap } from '.';
import { ComputedGraph } from './computed-graph';
import { PriorityQueue } from './priority-queue';
import { CostMap, DeepMap, DeepMapKey, DeepMapSource, PreviousMap } from './types';
import validateDeep, { findPath, removeDeepFromMap, toCostMap, toDeepMap, validateCostMap } from './util';

export interface IPathComputeOptions {
    avoid?: DeepMapKey[];
    goal?: DeepMapKey;
}
export interface IPathOptions {
    cost?: boolean;
    avoid?: DeepMapKey[];
    trim?: boolean;
    reverse?: boolean;
}

export interface PathWithCost { 
    path: DeepMapKey[] | null; 
    cost: number; 
}
export type Path = DeepMapKey[];

/** Creates and manages a graph */
export class Graph {

    private graph: DeepMap;

    /**
     * Creates a new Graph, optionally initializing it a nodes graph representation.
     *
     * A graph representation is an object that has as keys the name of the point and as values
     * the points reacheable from that node, with the cost to get there:
     *
     *     {
     *       node (Number|String): {
     *         neighbor (Number|String): cost (Number),
     *         ...,
     *       },
     *     }
     *
     * In alternative to an object, you can pass a `Map` of `Map`. This will
     * allow you to specify numbers as keys.
     *
     * @param {Object|Map} [graph] - Initial graph definition
     * @example
     *
     * const route = new Graph();
     *
     * // Pre-populated graph
     * const route = new Graph({
     *   A: { B: 1 },
     *   B: { A: 1, C: 2, D: 4 },
     * });
     *
     * // Passing a Map
     * const g = new Map()
     *
     * const a = new Map()
     * a.set('B', 1)
     *
     * const b = new Map()
     * b.set('A', 1)
     * b.set('C', 2)
     * b.set('D', 4)
     *
     * g.set('A', a)
     * g.set('B', b)
     *
     * const route = new Graph(g)
     */
    constructor(graph?: DeepMap | DeepMapSource) {
        if (graph instanceof Map) {
            validateDeep(graph);
            this.graph = graph;
        } else if (graph) {
            this.graph = toDeepMap(graph);
        } else {
            this.graph = new Map();
        }
    }

    /**
     * Adds a node to the graph
     *
     * @param {string} key      - Name of the node
     * @param {Object|Map} neighbors - Neighbouring nodes and cost to reach them
     * @return {this}
     * @example
     *
     * const route = new Graph();
     *
     * route.addNode('A', { B: 1 });
     *
     * // It's possible to chain the calls
     * route
     *   .addNode('B', { A: 1 })
     *   .addNode('C', { A: 3 });
     *
     * // The neighbors can be expressed in a Map
     * const d = new Map()
     * d.set('A', 2)
     * d.set('B', 8)
     *
     * route.addNode('D', d)
     */
    public addNode(key: DeepMapKey, neighbors: CostMap | DeepMapSourceCostMap): this {
        let costMap: CostMap;
        if (neighbors instanceof Map) {
            validateCostMap(neighbors);
            costMap = neighbors;
        } else {
            costMap = toCostMap(neighbors);
        }

        this.graph.set(key, costMap);

        return this;
    }

    /**
     * @deprecated since version 2.0, use `Graph#addNode` instead
     */
    public addVertex(key: DeepMapKey, neighbors: CostMap | DeepMapSourceCostMap): this {
        return this.addNode(key, neighbors);
    }

    /**
     * Removes a node and all of its references from the graph
     *
     * @param {string|number} key - Key of the node to remove from the graph
     * @return {this}
     * @example
     *
     * const route = new Graph({
     *   A: { B: 1, C: 5 },
     *   B: { A: 3 },
     *   C: { B: 2, A: 2 },
     * });
     *
     * route.removeNode('C');
     * // The graph now is:
     * // { A: { B: 1 }, B: { A: 3 } }
     */
    public removeNode(key: DeepMapKey): this {
        this.graph = removeDeepFromMap(this.graph, key);

        return this;
    }

    private computeGraph(start: DeepMapKey, options: IPathComputeOptions): [PreviousMap, CostMap] {
        const previousMap: PreviousMap = new Map();
        const costMap: CostMap = new Map();

        const explored = new Set<DeepMapKey>();
        const frontier = new PriorityQueue<DeepMapKey>();

        let avoid: Set<DeepMapKey>;
        if (options.avoid) {
            avoid = new Set(options.avoid);
        }
        else {
            avoid = new Set();
        }

        const oneToAll = options.goal === undefined;
        if (avoid.has(start)) {
            throw new Error(`Starting node (${start}) cannot be avoided`);
        } else if (!oneToAll && avoid.has(options.goal!)) {
            throw new Error(`Ending node (${options.goal}) cannot be avoided`);
        }

        // Add the starting point to the frontier, it will be the first node visited
        frontier.set(start, 0);

        // Run until we have visited every node in the frontier
        while (!frontier.isEmpty()) {
            // Get the node in the frontier with the lowest cost (`priority`)
            const node = frontier.next()!;

            // When the node with the lowest cost in the frontier in our goal node,
            // we can compute the path and exit the loop
            if (!oneToAll && node.key === options.goal) {
                break;
            }

            // Add the current node to the explored set
            explored.add(node.key);

            // Loop all the neighboring nodes
            const neighbors: CostMap = this.graph.get(node.key) || new Map();
            for (const [nNode, nCost] of neighbors) {
                // If we already explored the node, or the node is to be avoided, skip it
                if (explored.has(nNode) || avoid.has(nNode)) {
                    continue;
                }

                // If the neighboring node is not yet in the frontier, we add it with
                // the correct cost
                if (!frontier.has(nNode)) {
                    previousMap.set(nNode, node.key);
                    frontier.set(nNode, node.priority + nCost);
                    continue;
                }

                const frontierPriority = frontier.get(nNode)!.priority;
                const nodeCost = node.priority + nCost;

                // Otherwise we only update the cost of this node in the frontier when
                // it's below what's currently set
                if (nodeCost < frontierPriority) {
                    previousMap.set(nNode, node.key);
                    frontier.set(nNode, nodeCost);
                    costMap.set(nNode, nodeCost);
                }
            }
        }

        return [previousMap, costMap];
    }

    public computePathTo(start: DeepMapKey, options: IPathOptions = {}): ComputedGraph | undefined {
        // Don't run when we don't have nodes set
        if (!this.graph.size) {
            return undefined;
        }

        const [previousMap, costMap] = this.computeGraph(start, {
            avoid: options.avoid,
        });

        return new ComputedGraph(start, previousMap, costMap);
    }

    /**
     * Compute the shortest path between the specified nodes
     *
     * @param {string}  start     - Starting node
     * @param {string}  goal      - Node we want to reach
     * @param {object}  [options] - Options
     *
     * @param {boolean} [options.trim]    - Exclude the origin and destination nodes from the result
     * @param {boolean} [options.reverse] - Return the path in reversed order
     * @param {boolean} [options.cost]    - Also return the cost of the path when set to true
     *
     * @return {array|object} Computed path between the nodes.
     *
     *  When `option.cost` is set to true, the returned value will be an object with shape:
     *    - `path` *(Array)*: Computed path between the nodes
     *    - `cost` *(Number)*: Cost of the path
     *
     * @example
     *
     * const route = new Graph()
     *
     * route.addNode('A', { B: 1 })
     * route.addNode('B', { A: 1, C: 2, D: 4 })
     * route.addNode('C', { B: 2, D: 1 })
     * route.addNode('D', { C: 1, B: 4 })
     *
     * route.path('A', 'D') // => ['A', 'B', 'C', 'D']
     *
     * // trimmed
     * route.path('A', 'D', { trim: true }) // => [B', 'C']
     *
     * // reversed
     * route.path('A', 'D', { reverse: true }) // => ['D', 'C', 'B', 'A']
     *
     * // include the cost
     * route.path('A', 'D', { cost: true })
     * // => {
     * //       path: [ 'A', 'B', 'C', 'D' ],
     * //       cost: 4
     * //    }
     */
    public path(start: DeepMapKey, goal: DeepMapKey, options: IPathOptions = {}): PathWithCost | Path | null {
        // Don't run when we don't have nodes set
        if (!this.graph.size) {
            if (options.cost) {
                return { path: null, cost: 0 };
            }

            return null;
        }

        const [previousMap, costMap] = this.computeGraph(start, {
            avoid: options.avoid,
            goal: goal
        });

        // Return null when no path can be found
        if (!previousMap.has(goal)) {
            if (options.cost) {
                return {
                    path: null,
                    cost: 0
                };
            }

            return null;
        }

        // Set the total cost to the current value
        const totalCost = costMap.get(goal)!;
        let path = findPath(previousMap, goal);

        // From now on, keep in mind that `path` is populated in reverse order,
        // from destination to origin

        // Remove the first value (the goal node) if we want a trimmed result
        if (options.trim) {
            path.shift();
        }
        else {
            path.push(start);
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
                cost: totalCost,
            };
        }

        return path;
    }

    /**
     * @deprecated since version 2.0, use `Graph#path` instead
     */
    public shortestPath(start: DeepMapKey, goal: DeepMapKey, options: IPathOptions = {}) {
        return this.path(start, goal, options);
    }
}
