import * as React from "react";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import "./styles.css";
import { appDefaultState, appReducer, UserMessage } from "./AppReducer";
import AnomalyScorePlot from "./components/AnomalyScorePlot";
import AnomalyTable from "./components/AnomalyTable/AnomalyTable";
import Config from "./components/Configuration/Config";
import MessageSnackbar from "./components/MessageSnackbar";
import { AlgorithmConfiguration, prepareMapToSend } from "./components/Configuration/AlgorithmConfig";
import RawDataPlot from "./components/RawDataPlot";
import Prototypes from "./components/Prototypes";
import FeatureAttributionPlot from "./components/FeatureAttribution/FeatureAttributionPlot";
import { MessagingContext } from "./components/MessagingContext";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

export type Algorithm = {
    name: string;
    id: number;
    explainable: boolean;
    config: AlgorithmConfiguration;
};

export type Sensor = {
    type: string;
    desc: string;
    unit: string;
};

export type Anomaly = {
    type: string;
    timestamp: string;
};

export type DateRange = {
    start: Date | null;
    end: Date | null;
    min: Date | null;
    max: Date | null;
};

declare module "@mui/material/styles" {
    interface Theme {
        additional_graph_colors: string[];
    }

    interface ThemeOptions {
        additional_graph_colors: string[];
    }
}

function getOrSetUuid() {
    let local_uuid = sessionStorage.getItem("uuid");
    if (!local_uuid) {
        local_uuid = uuidv4();
        sessionStorage.setItem("uuid", local_uuid);
    }
    return local_uuid;
}

export const BASE_URL = process.env.BACKEND_BASE_URL as string; //Replaced by parcel at build time
export const UUID = getOrSetUuid();
const ADD_GRAPH_COLORS = ["#4CAF50", "#FFA726", "#D81B60"];

export function App() {
    const [state, dispatch] = useReducer(appReducer, null, appDefaultState);

    const messagingCallback = useCallback((msg: UserMessage) => dispatch({ type: "ShowMessage", message: msg }), []);
    const zoomHintCallback = useCallback(() => dispatch({ type: "ZoomHintShown" }), []);

    function handleApiError(response: Response) {
        let severity: "info" | "warning" | "error";
        if (response.status < 300) {
            severity = "info";
        } else if (response.status < 500) {
            severity = "warning";
        } else if (response.status < 600) {
            severity = "error";
        } else {
            console.log(`Status code: ${response.status}`);
            return; //Severity undetermined.
        }

        response.json().then((x) =>
            dispatch({
                type: "ShowMessage",
                message: {
                    severity: severity,
                    message: x["detail"],
                },
            })
        );
    }

    function handleNetworkError() {
        dispatch({
            type: "ShowMessage",
            message: {
                severity: "error",
                message: "Network Error: Something is wrong with the connection to the server.",
            },
        });
    }

    function makeNetworkFetch(
        url: string | URL,
        action: (json: any) => void,
        onError: () => void = () => undefined,
        header: {} = {}
    ) {
        class AlreadyHandledError extends Error{}

        function validateNetworkPromise(response: Response) {
            if (response.status === 200) {
                return response.json();
            } else {
                handleApiError(response);
                onError();
                throw new AlreadyHandledError();
            }
        }

        if ("string" === typeof url) {
            url = BASE_URL + url;
        }

        fetch(url, header)
            .then((response) => validateNetworkPromise(response))
            .then((result) => action(result))
            .catch(error => {
                if(error instanceof AlreadyHandledError) {
                    return;
                }
                handleNetworkError();
                onError();
            });
    }

    function handleBuildingChange(buildingName: string) {
        dispatch({ type: "BuildingSelected", buildingName: buildingName });

        const sensor_url = "/buildings/" + buildingName + "/sensors";
        makeNetworkFetch(sensor_url, (json) =>
            dispatch({
                type: "SensorsFetched",
                sensors: json["sensors"] as Sensor[],
            })
        );

        const timestamp_url = "/buildings/" + buildingName + "/timestamps";
        makeNetworkFetch(timestamp_url, (json) =>
            dispatch({
                type: "BuildingTimestampsFetched",
                timestamps: json["timestamps"] as string[],
            })
        );
    }

    function handleSensorChange(selectedSensors: Sensor[]) {
        dispatch({ type: "SensorsSelected", selectedSensors: selectedSensors });

        for (let s of selectedSensors) {
            if (state.sensorData[s.type] !== undefined) {
                continue;
            }

            dispatch({ type: "SensorFetchStarted" });
            const sensors_url = "/buildings/" + state.config.selectedBuilding + "/sensors/" + s.type;
            makeNetworkFetch(
                sensors_url,
                (result) =>
                    dispatch({
                        type: "SensorFetchCompleted",
                        sensorType: s.type,
                        sensorData: result["sensor"] as number[],
                    }),
                () => dispatch({ type: "SensorFetchFailed", sensorType: s.type })
            );
        }
    }

    function findAnomalies() {
        dispatch({ type: "AnomalySearchStarted" });

        let url = new URL("/calculate/anomalies", BASE_URL);
        url.searchParams.set("algo", String(state.config.selectedAlgorithm!.id));
        url.searchParams.set("building", state.config.selectedBuilding);
        url.searchParams.set("sensors", state.config.selectedSensors.map((s) => s.type).join(";"));
        url.searchParams.set("start", state.config.buildingDateRange.start!.toISOString());
        url.searchParams.set("stop", state.config.buildingDateRange.end!.toISOString());

        const configMap = prepareMapToSend(state.config.algorithmConfigResult[state.config.selectedAlgorithm!.id]);
        url.searchParams.set("config", JSON.stringify(configMap));

        const options = {
            headers: new Headers({ uuid: `${UUID}` }),
        };

        makeNetworkFetch(
            url,
            (json) => {
                dispatch({
                    type: "AnomalySearchCompleted",
                    timestamps: json["timestamps"] as string[],
                    scores: json["error"] as number[],
                    anomalies: json["anomalies"] as Anomaly[],
                    threshold: json["threshold"] as number,
                });
                dispatch({
                    type: "ShowMessage",
                    message: {
                        severity: "success",
                        message: `Found ${json["anomalies"].length} anomalies.`,
                    },
                });
            },
            () => dispatch({ type: "AnomalySearchFailed" }),
            options
        );
    }

    function anomalySection() {
        //Cache function to avoid re-rendering of anomaly table because of onSelect prop change
        const anomalySelectionDispatchCallback = useCallback(
            (index: number) =>
                dispatch({
                    type: "AnomalySelected",
                    anomalyIndex: index,
                }),
            []
        );

        if (state.anomalySearchCounter === 0) {
            return null;
        }

        return (
            <>
                <div id="anomaly-score">
                    <AnomalyScorePlot
                        key={"AnomalyScore" + state.anomalySearchCounter}
                        timestamps={state.anomalyScoreTimestamps}
                        errors={state.anomalyScores}
                        threshold={state.anomalyThreshold}
                        zoomHintShown={state.plotZoomHintShown}
                        onZoomHint={zoomHintCallback}
                    />
                </div>
                <div id="anomalies">
                    <AnomalyTable
                        key={"AnomaliesTable" + state.anomalySearchCounter}
                        anomalies={state.anomalies}
                        selectedIndex={state.selectedAnomalyIndex}
                        onSelect={anomalySelectionDispatchCallback}
                    />
                </div>
                <div id="prototypes">
                    <Prototypes anomalyID={state.selectedAnomalyIndex} networkFetch={makeNetworkFetch} />
                </div>
                <div id="features">
                    <FeatureAttributionPlot
                        algorithm={state.configMemento!.selectedAlgorithm!}
                        anomalyID={state.selectedAnomalyIndex}
                        networkFetch={makeNetworkFetch}
                    />
                </div>
            </>
        );
    }

    //One time side effects on first render
    useEffect(() => {
        //Fetch initial preferred color scheme
        dispatch({ type: "UpdateLightMode", isLightMode: window.matchMedia("(prefers-color-scheme: light)").matches })

        //Attach listener for light/dark mode.
        window
            .matchMedia("(prefers-color-scheme: light)")
            .addEventListener("change", (event) => dispatch({ type: "UpdateLightMode", isLightMode: event.matches }));

        //Fetch available buildings
        makeNetworkFetch("/buildings", (json) =>
            dispatch({
                type: "BuildingsFetched",
                buildings: json["buildings"] as string[],
            })
        );

        //Fetch available algorithms
        makeNetworkFetch("/algorithms", (json) =>
            dispatch({
                type: "AlgorithmsFetched",
                algorithms: json["algorithms"] as Algorithm[],
            })
        );
    }, []);

    //Do not create theme on every render to avoid expensive re-rendering of entire theme provider context
    const theme = useMemo(
        () =>
            createTheme({
                palette: { mode: state.isLightMode ? "light" : "dark" },
                additional_graph_colors: ADD_GRAPH_COLORS,
            }),
        [state.isLightMode]
    );

    const config = (
        <Config
            state={state}
            onDateRangeChange={(newStart, newEnd) =>
                dispatch({
                    type: "DateRangeChanged",
                    start: newStart,
                    end: newEnd,
                })
            }
            onBuildingChange={handleBuildingChange}
            onSensorChange={handleSensorChange}
            onAlgorithmChange={(newAlgo) =>
                dispatch({
                    type: "AlgorithmSelected",
                    algorithm: newAlgo,
                })
            }
            onFindAnomalies={findAnomalies}
            onAlgoConfigChange={(settingID, newValue) =>
                dispatch({
                    type: "AlgorithmSettingChanged",
                    settingID: settingID,
                    newValue: newValue,
                })
            }
        />
    );

    const rawDataPlot = (
        <RawDataPlot
            key={"RawData" + state.config.selectedBuilding} //Reset on building change
            showHint={state.config.selectedBuilding === "" || state.config.selectedSensors.length < 1}
            timestamps={state.buildingTimestamps}
            timeseries={state.sensorData}
            sensors={state.config.selectedSensors}
            dateRange={state.config.buildingDateRange}
            zoomHintShown={state.plotZoomHintShown}
            onZoomHint={zoomHintCallback}
        />
    );

    return (
        <MessagingContext.Provider value={messagingCallback}>
            <ThemeProvider theme={theme}>
                <CssBaseline enableColorScheme />
                <MessageSnackbar messageQueue={state.messageQueue} onClose={() => dispatch({ type: "MessageDone" })} />
                <div id="root-container">
                    <div id="grid-container">
                        <div id="config">{config}</div>
                        <div id="raw-data">{rawDataPlot}</div>
                        {anomalySection()}
                    </div>
                </div>
            </ThemeProvider>
        </MessagingContext.Provider>
    );
}
