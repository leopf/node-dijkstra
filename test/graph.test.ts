import { Graph, Path, PathWithCost } from "../src";

describe("Graph", () => {
    describe("#constructor", () => {
        test("creates an instance of Graph", () => {
            const graph = new Graph();
            expect(graph).toBeInstanceOf(Graph);
        });
        test("returns the Graph object", () => {
            const graph = new Graph();
            expect(graph.addNode('a', { "b": 10, "c": 20 })).toBeInstanceOf(Graph);
        })
    });

    describe("#path", () => {

        const vertices = {
            a: { b: 20, c: 80 },
            b: { a: 20, c: 20 },
            c: { a: 80, b: 20 },
        };

        test('retuns the shortest path', () => {
            const route = new Graph(vertices);

            const path = route.path('a', 'c');
            expect(path).toEqual(['a', 'b', 'c']);
        });

        test('retuns an object containing the cost', () => {
            const route = new Graph(vertices);

            const res = route.path('a', 'c', { cost: true }) as PathWithCost;

            expect(typeof res).toBe("object");
            expect(res.path).toEqual(['a', 'b', 'c']);
            expect(res.cost).toEqual(40);
        });

        test('retuns the inverted path', () => {
            const route = new Graph(vertices);

            const path = route.path('a', 'c', { reverse: true }) as Path;

            expect(path).toEqual(['c', 'b', 'a']);
        });

        test('retuns an object containing the cost and inverted path', () => {
            const route = new Graph(vertices);

            const res = route.path('a', 'c', { cost: true, reverse: true }) as PathWithCost;

            expect(typeof res).toBe("object");
            expect(res.path).toEqual(['c', 'b', 'a']);
            expect(res.cost).toEqual(40);
        });

        test('retuns the trimmed path', () => {
            const route = new Graph(vertices);

            const path = route.path('a', 'c', { trim: true }) as Path;
            expect(path).toEqual(['b']);
        });

        test('retuns an object containing the cost and trimmed path', () => {
            const route = new Graph(vertices);

            const res = route.path('a', 'c', { cost: true, trim: true }) as PathWithCost;

            expect(typeof res).toBe("object");
            expect(res.path).toEqual(['b']);
            expect(res.cost).toEqual(40);
        });

        test('retuns the reverse and trimmed path', () => {
            const route = new Graph(vertices);

            const path = route.path('a', 'c', { trim: true });

            expect(path).toEqual(['b']);
        });

        test('retuns an object containing the cost and inverted and trimmed path', () => {
            const route = new Graph(vertices);

            const res = route.path('a', 'c', { cost: true, reverse: true, trim: true }) as PathWithCost;

            expect(typeof res).toBe("object");
            expect(res.path).toEqual(['b']);
            expect(res.cost).toEqual(40);
        });

        test('returns null when no path is found', () => {
            const route = new Graph(vertices);

            const path = route.path('a', 'd');

            expect(path).toBeNull();
        });

        test('returns null as path and 0 as cost when no path exists and we want the cost', () => {
            const route = new Graph(vertices);

            const res = route.path('a', 'd', { cost: true }) as PathWithCost;
            expect(res.path).toBeNull();
            expect(res.cost).toEqual(0);
        });


        test('returns null when no vertices are defined', () => {
            const route = new Graph();

            const path = route.path('a', 'd');
            expect(path).toBeNull();
        });

        test('returns null as path and 0 as cost when no vertices are defined and we want the cost',
            () => {
                const route = new Graph();

                const res = route.path('a', 'd', { cost: true }) as PathWithCost;

                expect(res.path).toBeNull();
                expect(res.cost).toEqual(0);
            });

        test('returns the same path if a node which is not part of the shortest path is avoided', () => {
            const route = new Graph({
                a: { b: 1 },
                b: { a: 1, c: 1 },
                c: { b: 1, d: 1 },
                d: { c: 1 },
            });

            const path = route.path('a', 'c', { cost: true });
            const path2 = route.path('a', 'c', { avoid: ['d'], cost: true });

            expect(path).toEqual(path2);
        });

        test('returns a different path if a node which is part of the shortest path is avoided',
            () => {
                const route = new Graph({
                    a: { b: 1, c: 50 },
                    b: { a: 1, c: 1 },
                    c: { a: 50, b: 1, d: 1 },
                    d: { c: 1 },
                });

                const res = route.path('a', 'd', { cost: true }) as PathWithCost;
                const res2 = route.path('a', 'd', { avoid: ['b'], cost: true }) as PathWithCost;

                expect(res.path).not.toEqual(res2.path);
                expect(res.cost).toBeLessThanOrEqual(res2.cost);
            });

        test('throws an error if the start node is avoided',
            () => {
                const route = new Graph(vertices);
                expect(() => route.path('a', 'c', { avoid: ['a'] })).toThrowError()
            });
    });
});
