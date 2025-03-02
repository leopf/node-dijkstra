export interface IQueueItem<K> {
    priority: number;
    key: K;
}

/**
 * This very basic implementation of a priority queue is used to select the
 * next node of the graph to walk to.
 *
 * The queue is always sorted to have the least expensive node on top.
 * Some helper methods are also implemented.
 *
 * You should **never** modify the queue directly, but only using the methods
 * provided by the class.
 */
export class PriorityQueue<K> {

    private keys: Set<K>;
    private queue: IQueueItem<K>[];

    /**
     * Creates a new empty priority queue
     */
    constructor() {
        // The `keys` set is used to greatly improve the speed at which we can
        // check the presence of a value in the queue
        this.keys = new Set<K>();
        this.queue = [];
    }

    /**
     * Sort the queue to have the least expensive node to visit on top
     *
     * @private
     */
    private sort(): void {
        this.queue.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Sets a priority for a key in the queue.
     * Inserts it in the queue if it does not already exists.
     *
     * @param {any}     key       Key to update or insert
     * @param {number}  value     Priority of the key
     * @return {number} Size of the queue
     */
    public set(key: K, value: number): number {
        const priority = Number(value);
        if (isNaN(priority)) throw new TypeError('"priority" must be a number');

        if (!this.keys.has(key)) {
            // Insert a new entry if the key is not already in the queue
            this.keys.add(key);
            this.queue.push({ key, priority });
        } else {
            // Update the priority of an existing key
            this.queue.map((element) => {
                if (element.key === key) {
                    Object.assign(element, { priority });
                }

                return element;
            });
        }

        this.sort();
        return this.queue.length;
    }

    /**
     * The next method is used to dequeue a key:
     * It removes the first element from the queue and returns it
     *
     * @return {object} First priority queue entry
     */
    public next(): IQueueItem<K> | undefined {
        const element = this.queue.shift();

        if (element) {
            // Remove the key from the `_keys` set
            this.keys.delete(element.key);

            return element;
        }
        else {
            return undefined;
        }
    }

    /**
     * @return {boolean} `true` when the queue is empty
     */
    public isEmpty(): boolean {
        return Boolean(this.queue.length === 0);
    }

    /**
     * Check if the queue has a key in it
     *
     * @param {any} key   Key to lookup
     * @return {boolean}
     */
    public has(key: K): boolean {
        return this.keys.has(key);
    }

    /**
     * Get the element in the queue with the specified key
     *
     * @param {any} key   Key to lookup
     * @return {object}
     */
    public get(key: K): IQueueItem<K> | undefined {
        return this.queue.find(element => element.key === key);
    }
}