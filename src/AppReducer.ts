import { Algorithm, Anomaly, DateRange, Sensor } from "./App";
import { buildDefaultMap, ValueType } from "./components/Configuration/AlgorithmConfig";
import { AlertColor } from "@mui/material";
import produce from "immer";

type AlgorithmSettingMap = Record<number, Record<string, ValueType>>;

type AppState = {
    isLightMode: boolean;
    isWaitingForAnomalyResult: boolean;
    sensorFetchesPending: number;
    snackbarConfig: { severity: AlertColor; message: string } | null;

    buildingNames: string[];
    selectedBuilding: string;
    buildingTimestamps: string[];
    buildingDateRange: DateRange;

    availableAlgorithms: Algorithm[];
    selectedAlgorithm: Algorithm | null;
    algorithmConfigResult: AlgorithmSettingMap;

    availableSensors: Sensor[];
    selectedSensors: Sensor[];
    sensorData: Record<string, number[] | undefined>;

    anomaliesReceived: boolean;
    anomalyScores: number[];
    anomalyScoreTimestamps: string[];
    anomalies: Anomaly[];
    anomalyThreshold: number;

    selectedAnomalyIndex: number;
};

type AppAction =
    | { type: "UpdateLightMode"; isLightMode: boolean }
    | { type: "SensorFetchStarted" }
    | { type: "SensorFetchFailed" }
    | { type: "SensorFetchCompleted"; sensorType: string; sensorData: number[] }
    | { type: "SensorsFetched"; sensors: Sensor[] }
    | { type: "SensorsSelected"; selectedSensors: Sensor[] }
    | { type: "BuildingsFetched"; buildings: string[] }
    | { type: "BuildingSelected"; buildingName: string }
    | { type: "BuildingTimestampsFetched"; timestamps: string[] }
    | { type: "AlgorithmsFetched"; algorithms: Algorithm[] }
    | { type: "AlgorithmSelected"; algorithm: Algorithm }
    | { type: "AnomalySelected"; anomalyIndex: number }
    | { type: "ShowSnackbar"; severity: AlertColor; message: string }
    | { type: "HideSnackbar" }
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
        snackbarConfig: null,

        buildingNames: [],
        selectedBuilding: "",
        buildingTimestamps: [],
        buildingDateRange: { max: null, min: null, start: null, end: null },

        availableAlgorithms: [],
        selectedAlgorithm: null,
        algorithmConfigResult: {},

        availableSensors: [],
        selectedSensors: [],
        sensorData: {},

        anomaliesReceived: false,
        anomalyScores: [],
        anomalyScoreTimestamps: [],
        anomalies: [],
        anomalyThreshold: 0,

        selectedAnomalyIndex: 0,
    };
}

export function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case "UpdateLightMode":
            return { ...state, isLightMode: action.isLightMode };
        case "SensorFetchStarted":
            return { ...state, sensorFetchesPending: state.sensorFetchesPending + 1 };
        case "SensorFetchFailed":
            return { ...state, sensorFetchesPending: state.sensorFetchesPending - 1 };
        case "BuildingsFetched":
            return { ...state, buildingNames: action.buildings };
        case "AlgorithmSelected":
            return { ...state, selectedAlgorithm: action.algorithm };
        case "AnomalySelected":
            return { ...state, selectedAnomalyIndex: action.anomalyIndex };
        case "ShowSnackbar":
            return { ...state, snackbarConfig: { severity: action.severity, message: action.message } };
        case "HideSnackbar":
            return { ...state, snackbarConfig: null };
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
            return { ...state, buildingDateRange: newDateRange, buildingTimestamps: action.timestamps };
        case "SensorFetchCompleted":
            return produce(state, (draft) => {
                draft.sensorFetchesPending--;
                draft.sensorData[action.sensorType] = action.sensorData;
            });
        case "AnomalySearchCompleted":
            return {
                ...state,
                snackbarConfig: { severity: "success", message: `Found ${action.anomalies.length} anomalies.` },
                isWaitingForAnomalyResult: false,
                anomaliesReceived: true,
                selectedAnomalyIndex: 0,
                anomalyScores: action.scores,
                anomalyScoreTimestamps: action.timestamps,
                anomalies: action.anomalies,
                anomalyThreshold: action.threshold,
            };
        case "BuildingSelected":
            return {
                ...state,
                selectedBuilding: action.buildingName,
                buildingTimestamps: [],
                sensorData: {},
                selectedSensors: [],
            };
        case "SensorsFetched":
            return { ...state, availableSensors: action.sensors };
        case "SensorsSelected":
            return { ...state, selectedSensors: action.selectedSensors };
        case "AlgorithmsFetched": {
            let configs: AlgorithmSettingMap = {};
            for (const algo of action.algorithms) {
                configs[algo.id] = buildDefaultMap(algo.config);
            }
            return { ...state, algorithmConfigResult: configs, availableAlgorithms: action.algorithms };
        }
        case "AlgorithmSettingChanged": {
            if (state.selectedAlgorithm === null) {
                throw new Error("Algorithm config changed but no algorithm is selected.");
            }
            return produce(state, (draft) => {
                draft.algorithmConfigResult[state.selectedAlgorithm!.id][action.settingID] = action.newValue;
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

            if (state.buildingDateRange.min === null || state.buildingDateRange.max === null) {
                throw new Error("Cannot update DateRange when limits are unknown.");
            }

            if (start !== null && start < state.buildingDateRange.min) {
                start = state.buildingDateRange.min;
            }

            if (end !== null && end > state.buildingDateRange.max) {
                end = state.buildingDateRange.max;
            }

            return produce(state, (draft) => {
                draft.buildingDateRange.start = start;
                draft.buildingDateRange.end = end;
            });
        }
    }
}
