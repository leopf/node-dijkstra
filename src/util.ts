import { DeepMapSourceCostMap } from ".";
import { CostMap, DeepMap, DeepMapKey, DeepMapSource } from "./types";

function removeKeyFromCostMap(map: CostMap, key: DeepMapKey) {
  const newMap: CostMap = new Map();
  for (const [eKey, cost] of map.entries()) {
    if (key !== eKey) {
      newMap.set(eKey, cost);
    }
  }
  return newMap;
}

/**
 * Removes a key and all of its references from a map.
 * This function has no side-effects as it returns
 * a brand new map.
 *
 * @param {Map}     map - Map to remove the key from
 * @param {string}  key - Key to remove from the map
 * @return {Map}    New map without the passed key
 */
export function removeDeepFromMap(map: DeepMap, key: DeepMapKey): DeepMap {
  const newMap: DeepMap = new Map();

  for (const [aKey, val] of map) {
    if (aKey !== key) {
      newMap.set(aKey, removeKeyFromCostMap(val, key));
    }
  }

  return newMap;
}

export function findPath(previousMap: Map<DeepMapKey, DeepMapKey>, goal: DeepMapKey) {
  const path: DeepMapKey[] = [];
  let current: DeepMapKey | undefined = goal;
  while (current !== undefined && previousMap.has(current)) {
    path.push(current);
    current = previousMap.get(current);
  }
  return path;
}


/**
 * Validates a cost for a node
 *
 * @private
 * @param {number} val - Cost to validate
 * @return {bool}
 */
function isValidNode(val: string | number): boolean {
  const cost = Number(val);

  if (isNaN(cost) || cost <= 0) {
    return false;
  }

  return true;
}

export function toCostMap(connectionMap: DeepMapSourceCostMap) {
  const innerMap: CostMap = new Map();
  const connectionKeys = Object.keys(connectionMap);
  for (const connectionKey of connectionKeys) {
    const costVal = connectionMap[connectionKey];

    if (!isValidNode(costVal)) {
      throw new Error(`Could not add node, make sure it's a valid node`);
    }

    innerMap.set(connectionKey, Number(costVal));
  }
  return innerMap;
}

/**
 * Creates a deep `Map` from the passed object.
 *
 * @param  {Object} source - Object to populate the map with
 * @return {Map} New map with the passed object data
 */
export function toDeepMap(source: DeepMapSource): DeepMap {
  const map: DeepMap = new Map();
  const keys = Object.keys(source);

  for (const key of keys) {
    const connectionMap = source[key];

    if (connectionMap === null || typeof connectionMap !== 'object' || Array.isArray(connectionMap)) {
      throw new Error(`Could not add node at key "${key}", make sure it's a valid node`);
    }

    map.set(key, toCostMap(connectionMap));
  }

  return map;
}

export function validateCostMap(map: CostMap) {
  for (const value of map.values()) {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`Values must be numbers greater than 0. Found value ${value} in connection.`);
    }
  }
}

/**
 * Validate a map to ensure all it's values are either a number or a map
 *
 * @param {Map} map - Map to valiadte
 */
export default function validateDeep(map: DeepMap): void {
  if (!(map instanceof Map)) {
    throw new Error(`Invalid graph: Expected Map instead found ${typeof map}`);
  }

  for (const value of map.values()) {
    if (typeof value === 'object' && value instanceof Map) {
      validateCostMap(value);
    }
    else {
      throw new Error(`Invalid cost map!`);
    }
  }
}
