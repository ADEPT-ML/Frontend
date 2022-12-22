import { Algorithm, Anomaly, DateRange, Sensor } from "./App";
import { buildDefaultMap, ValueType } from "./components/Configuration/AlgorithmConfig";
import { AlertColor } from "@mui/material";
import produce from "immer";

type AlgorithmSettingMap = Record<number, Record<string, ValueType>>;

export type UserMessage = {
    severity: AlertColor;
    message: string;
    timeout?: number;
};

type KeyedUserMessage = UserMessage & {
    key: string;
};

export type AppState = {
    isLightMode: boolean;
    isWaitingForAnomalyResult: boolean;
    sensorFetchesPending: number;
    messageQueue: KeyedUserMessage[];

    buildingNames: string[];
    buildingTimestamps: string[];

    availableAlgorithms: Algorithm[];

    availableSensors: Sensor[];
    sensorData: Record<string, number[] | undefined>;

    anomalySearchCounter: number;
    anomalyScores: number[];
    anomalyScoreTimestamps: string[];
    anomalies: Anomaly[];
    anomalyThreshold: number;

    selectedAnomalyIndex: number;

    config: {
        selectedBuilding: string;
        buildingDateRange: DateRange;
        selectedAlgorithm: Algorithm | null;
        selectedSensors: Sensor[];
        algorithmConfigResult: AlgorithmSettingMap;
    };

    configMemento: AppState["config"] | null;
};

type AppAction =
    | { type: "ShowMessage"; message: UserMessage }
    | { type: "MessageDone" }
    | { type: "UpdateLightMode"; isLightMode: boolean }
    | { type: "SensorFetchStarted" }
    | { type: "SensorFetchFailed"; sensorType: string }
    | { type: "SensorFetchCompleted"; sensorType: string; sensorData: number[] }
    | { type: "SensorsFetched"; sensors: Sensor[] }
    | { type: "SensorsSelected"; selectedSensors: Sensor[] }
    | { type: "BuildingsFetched"; buildings: string[] }
    | { type: "BuildingSelected"; buildingName: string }
    | { type: "BuildingTimestampsFetched"; timestamps: string[] }
    | { type: "AlgorithmsFetched"; algorithms: Algorithm[] }
    | { type: "AlgorithmSelected"; algorithm: Algorithm }
    | { type: "AnomalySelected"; anomalyIndex: number }
    | { type: "AnomalySearchStarted" }
    | { type: "AnomalySearchFailed" }
    | {
          type: "AnomalySearchCompleted";
          scores: number[];
          timestamps: string[];
          anomalies: Anomaly[];
          threshold: number;
      }
    | { type: "DateRangeChanged"; start: Date | null; end: Date | null }
    | { type: "AlgorithmSettingChanged"; settingID: string; newValue: ValueType };

export function appDefaultState(): AppState {
    return {
        isLightMode: false,
        isWaitingForAnomalyResult: false,
        sensorFetchesPending: 0,
        messageQueue: [],

        buildingNames: [],
        buildingTimestamps: [],

        availableAlgorithms: [],

        availableSensors: [],
        sensorData: {},

        anomalySearchCounter: 0,
        anomalyScores: [],
        anomalyScoreTimestamps: [],
        anomalies: [],
        anomalyThreshold: 0,

        selectedAnomalyIndex: 0,

        config: {
            selectedBuilding: "",
            buildingDateRange: { max: null, min: null, start: null, end: null },
            selectedAlgorithm: null,
            selectedSensors: [],
            algorithmConfigResult: {},
        },

        configMemento: null,
    };
}

export function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case "ShowMessage":
            return produce(state, (draft) => {
                draft.messageQueue.push({ ...action.message, key: "Message" + Math.random().toString() });
            });
        case "MessageDone":
            return produce(state, (draft) => {
                draft.messageQueue.shift();
            });
        case "UpdateLightMode":
            return { ...state, isLightMode: action.isLightMode };
        case "SensorFetchStarted":
            return { ...state, sensorFetchesPending: state.sensorFetchesPending + 1 };
        case "SensorFetchFailed":
            return produce(state, (draft) => {
                draft.sensorFetchesPending--;
                draft.config.selectedSensors = draft.config.selectedSensors.filter((s) => s.type !== action.sensorType);
            });
        case "BuildingsFetched":
            return { ...state, buildingNames: action.buildings };
        case "AlgorithmSelected":
            return produce(state, (draft) => {
                draft.config.selectedAlgorithm = action.algorithm;
            });
        case "AnomalySelected":
            return { ...state, selectedAnomalyIndex: action.anomalyIndex };
        case "AnomalySearchStarted":
            return { ...state, isWaitingForAnomalyResult: true };
        case "AnomalySearchFailed":
            return { ...state, isWaitingForAnomalyResult: false };
        case "BuildingTimestampsFetched":
            const newDateRange =
                action.timestamps.length < 1
                    ? {
                          max: null,
                          min: null,
                          start: null,
                          end: null,
                      }
                    : {
                          min: new Date(action.timestamps[0]),
                          start: new Date(action.timestamps[0]),
                          max: new Date(action.timestamps[action.timestamps.length - 1]),
                          end: new Date(action.timestamps[action.timestamps.length - 1]),
                      };
            return produce(state, (draft) => {
                draft.config.buildingDateRange = newDateRange;
                draft.buildingTimestamps = action.timestamps;
            });
        case "SensorFetchCompleted":
            return produce(state, (draft) => {
                draft.sensorFetchesPending--;
                draft.sensorData[action.sensorType] = action.sensorData;
            });
        case "AnomalySearchCompleted":
            return {
                ...state,
                isWaitingForAnomalyResult: false,
                anomalySearchCounter: state.anomalySearchCounter + 1,
                selectedAnomalyIndex: 0,
                anomalyScores: action.scores,
                anomalyScoreTimestamps: action.timestamps,
                anomalies: action.anomalies,
                anomalyThreshold: action.threshold,
                configMemento: structuredClone(state.config),
            };
        case "BuildingSelected":
            return produce(state, (draft) => {
                draft.config.selectedBuilding = action.buildingName;
                draft.buildingTimestamps = [];
                draft.sensorData = {};
                draft.config.selectedSensors = [];
            });
        case "SensorsFetched":
            return { ...state, availableSensors: action.sensors };
        case "SensorsSelected":
            return produce(state, (draft) => {
                draft.config.selectedSensors = action.selectedSensors;
            });
        case "AlgorithmsFetched": {
            let configs: AlgorithmSettingMap = {};
            for (const algo of action.algorithms) {
                configs[algo.id] = buildDefaultMap(algo.config);
            }
            return produce(state, (draft) => {
                draft.config.algorithmConfigResult = configs;
                draft.availableAlgorithms = action.algorithms;
            });
        }
        case "AlgorithmSettingChanged": {
            if (state.config.selectedAlgorithm === null) {
                throw new Error("Algorithm config changed but no algorithm is selected.");
            }
            return produce(state, (draft) => {
                draft.config.algorithmConfigResult[state.config.selectedAlgorithm!.id][action.settingID] =
                    action.newValue;
            });
        }
        case "DateRangeChanged": {
            let start = action.start;
            let end = action.end;
            if (start !== null) {
                start.setHours(0, 0, 0);
            }
            if (end !== null) {
                end.setHours(23, 59, 59);
            }

            const currentRange = state.config.buildingDateRange;
            if (currentRange.min === null || currentRange.max === null) {
                throw new Error("Cannot update DateRange when limits are unknown.");
            }

            if (start !== null && start < currentRange.min) {
                start = currentRange.min;
            }

            if (end !== null && end > currentRange.max) {
                end = currentRange.max;
            }

            return produce(state, (draft) => {
                draft.config.buildingDateRange.start = start;
                draft.config.buildingDateRange.end = end;
            });
        }
    }
}

export function isConfigDirty(state: AppState): boolean {
    const clean =
        state.configMemento !== null &&
        state.config.selectedAlgorithm !== null &&
        state.config.buildingDateRange.start !== null &&
        state.config.buildingDateRange.end !== null &&
        state.config.buildingDateRange.start.getTime() === state.configMemento.buildingDateRange.start!.getTime() &&
        state.config.buildingDateRange.end.getTime() === state.configMemento.buildingDateRange.end!.getTime() &&
        state.config.selectedBuilding === state.configMemento.selectedBuilding &&
        state.config.selectedAlgorithm.id === state.configMemento.selectedAlgorithm!.id;
    if (!clean) return true;

    for (const s of state.config.selectedSensors) {
        const found = state.configMemento!.selectedSensors.find((oldSensor) => oldSensor.type === s.type);
        if (found === undefined) return true;
    }

    const algoID = state.config.selectedAlgorithm!.id;
    for (const key in state.config.algorithmConfigResult[algoID]) {
        const val = state.configMemento!.algorithmConfigResult[algoID][key];
        if (val !== state.config.algorithmConfigResult[algoID][key]) return true;
    }
    return false;
}
