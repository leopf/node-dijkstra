export type EdgeCost = string | number;
export type DeepMapSourceCostMap = { [key: string]: number }
export type DeepMapSource = { [key: string]: DeepMapSourceCostMap}
export type DeepMapKey = string | number;
export type CostMap = Map<DeepMapKey, number>;
export type DeepMap = Map<DeepMapKey, CostMap>
export type PreviousMap = Map<DeepMapKey, DeepMapKey>;


