import * as React from "react";
import {useEffect, useState} from "react";
import "./styles.css"
import RawDataPlot from "./components/RawDataPlot";
import AnomalyScorePlot from "./components/AnomalyScorePlot";
import FeatureAttributionPlot from "./components/FeatureAttribution/FeatureAttributionPlot";
import AnomalyTable from "./components/AnomalyTable/AnomalyTable";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import Config from "./components/Configuration/Config";
import Prototypes from "./components/Prototypes";
import {AlgorithmConfiguration, buildDefaultMap} from "./components/Configuration/AlgorithmConfig";
import {v4 as uuidv4} from 'uuid';

export type Algorithm = {
    name: string;
    id: number;
    explainable: boolean;
}

export type Sensor = {
    type: string;
    desc: string;
    unit: string;
}

export type Anomaly = {
    type: string;
    timestamp: string;
}

type AnomalyResponse = {
    error: number[];
    timestamps: string[];
    anomalies: Anomaly[];
    threshold: number;
}

export type DateRange = {
    start: Date | null;
    end: Date | null;
    min: Date | null;
    max: Date | null;
}

export type TimeSeries = Record<string, number[] | undefined>;

const BASE_URL = "http://localhost:8000";
const ADD_GRAPH_COLORS = ["#4CAF50", "#FFA726", "#D81B60"];
const LIGHT_THEME = false;
const darkTheme = createTheme({
    palette: {
        mode: LIGHT_THEME ? "light" : "dark",
    }
})
const UUID = getOrSetUuid();

export function getOrSetUuid() {
    let local_uuid = localStorage.getItem("uuid");
    if (!local_uuid) {
        local_uuid = uuidv4();
        localStorage.setItem("uuid", local_uuid);
    }
    return local_uuid;
}

export function App() {
    const [buildings, setBuildings] = useState<string[]>([]);
    const [building, setBuilding] = useState<string>("");
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [selectedSensors, setSelectedSensors] = useState<Sensor[]>([]);
    const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
    const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
    const [timestamps, setTimestamps] = useState<string[]>([]);
    const [timeseries, setTimeseries] = useState<TimeSeries>({});
    const [selectedAnomalyIndex, setSelectedAnomalyIndex] = useState<number>(0);
    const [anomalyResponse, setAnomalyResponse] = useState<AnomalyResponse | null>(null);
    const [calculatingAnomalies, setCalculatingAnomalies] = useState<boolean>(false);
    const [pendingUpdates, setPendingUpdates] = useState<number>(0);
    const [dateRange, setDateRange] = useState<DateRange>({max: null, min: null, start: null, end: null});
    const [error, setError] = useState(null);
    const [errorFetchedChecker, setErrorFetchedChecker] = useState(false);
    const [showRetry, setShowRetry] = useState(false);

    const mockAlgoConfig: AlgorithmConfiguration = {
        "settings": [{
            "id": "id",
            "name": "opt_name",
            "type": "Option",
            "docstring": "This is a longer docstring to test the behavior of such longer docstrings.",
            "default": "name",
            "options": [{
                "name": "name",
                "settings": [{
                    "id": "test",
                    "name": "name",
                    "type": "Numeric",
                    "docstring": "Hallo Welt",
                    "default": 1.0,
                    "step": 0.1,
                    "lowBound": 0.8
                }, {
                    "id": "abcd",
                    "name": "AnotherValue",
                    "type": "Numeric",
                    "default": 14.0,
                    "step": 0.1
                }, {
                    "id": "tog_id",
                    "name": "Toggle me",
                    "type": "Toggle",
                    "docstring": "This can be \"toggled\"",
                    "default": false
                }]
            }, {"name": "name2", "settings": []}]
        }, {
            "id": "test2",
            "name": "name2",
            "type": "Numeric",
            "docstring": "Hallo Welt2",
            "default": 165.4,
            "step": 0.1,
            "lowBound": -0.9
        }, {"id": "tog_id2", "name": "Also toggle me", "type": "Toggle", "default": false}]
    };
    const [algoConfigResult, setAlgoConfigResult] = useState<Record<string, string | number | boolean>>(buildDefaultMap(mockAlgoConfig))

    function handleBuildingChange(buildingName: string) {
        setBuilding(buildingName);
        setSelectedSensors([]);
        setSensors([]);
        setTimestamps([]);
        setTimeseries({});

        fetch(BASE_URL + "/buildings/" + buildingName + "/sensors")
            .then(res => res.json())
            .then(
                (result) => {
                    setSensors(result["sensors"]);
                },
                (error) => {
                    setError(error);
                }
            )

        fetch(BASE_URL + "/buildings/" + buildingName + "/timestamps")
            .then(res => res.json())
            .then(
                (result) => {
                    const stamps = result["timestamps"] as string[];
                    setTimestamps(stamps);
                    if (stamps.length === 0) return;
                    setDateRange({
                        min: new Date(stamps[0]),
                        start: new Date(stamps[0]),
                        max: new Date(stamps[stamps.length - 1]),
                        end: new Date(stamps[stamps.length - 1])
                    });
                },
                (error) => {
                    setError(error);
                }
            )
    }

    function handleSensorChange(selected: Sensor[]) {
        setSelectedSensors(selected);

        for (let s of selected) {
            if (timeseries[s.type] !== undefined) {
                continue;
            }

            setPendingUpdates(c => c + 1);
            fetch(BASE_URL + "/buildings/" + building + "/sensors/" + s.type)
                .then(res => res.json())
                .then(
                    (result) => {
                        setTimeseries(t => {
                            return {...t, [s.type]: result["sensor"]}
                        });
                        setPendingUpdates(c => c - 1);
                    },
                    (error) => {
                        setError(error);
                        setPendingUpdates(c => c - 1);
                    }
                )
        }
    }

    function handleAlgorithmChange(newAlgorithm: Algorithm) {
        setAlgorithm(newAlgorithm);
    }

    function handleAnomalySelect(anomalyIndex: number) {
        setSelectedAnomalyIndex(anomalyIndex);
    }

    function handleDateRangeChange(start: Date | null, end: Date | null) {
        if (start !== null) {
            start.setHours(0, 0, 0);
        }
        if (end !== null) {
            end.setHours(23, 59, 59);
        }

        if (dateRange.min === null || dateRange.max === null) {
            throw new Error("Cannot update DateRange when limits are unknown.");
        }

        if (start !== null && start < dateRange.min) {
            start = dateRange.min;
        }

        if (end !== null && end > dateRange.max) {
            end = dateRange.max;
        }

        setDateRange({...dateRange, start: start, end: end});
    }


    function canFindAnomalies() {
        return !pendingUpdates && building !== "" && selectedSensors.length > 0 && algorithm !== null &&
            dateRange.start !== null && dateRange.end !== null;
    }

    function findAnomalies() {
        setCalculatingAnomalies(true);
        let url = new URL("/calculate/anomalies", BASE_URL);
        url.searchParams.set("algo", String(algorithm!.id));
        url.searchParams.set("building", building);
        url.searchParams.set("sensors", selectedSensors.map(s => s.type).join(";"));
        url.searchParams.set("start", dateRange.start!.toISOString());
        url.searchParams.set("stop", dateRange.end!.toISOString());
        const options = {
            headers: new Headers({'uuid': `${localStorage.getItem("uuid")}`})
        }

        fetch(url.toString(), options)
            .then(res => res.json())
            .then(
                (result) => {
                    setAnomalyResponse(result);
                    setSelectedAnomalyIndex(0);
                    setCalculatingAnomalies(false);
                },
                (error) => {
                    setError(error);
                }
            )
    }

    function anomalySection() {
        if (anomalyResponse === null) {
            return null;
        }
        return <>
            <div id="anomaly-score">
                <AnomalyScorePlot
                    timestamps={anomalyResponse.timestamps}
                    errors={anomalyResponse.error}
                    threshold={anomalyResponse.threshold}
                    lightTheme={LIGHT_THEME}
                />
            </div>
            <div id="anomalies">
                <AnomalyTable
                    anomalies={anomalyResponse.anomalies}
                    selectedIndex={selectedAnomalyIndex}
                    onSelect={handleAnomalySelect}
                />
            </div>
            <div id="prototypes">
                <Prototypes
                    anomalyID={selectedAnomalyIndex}
                    baseURL={BASE_URL}
                    lightTheme={LIGHT_THEME}
                />
            </div>
            <div id="features">
                <FeatureAttributionPlot
                    algorithm={algorithm!}
                    baseURL={BASE_URL}
                    anomalyID={selectedAnomalyIndex}
                    additionalColors={ADD_GRAPH_COLORS}
                    lightTheme={LIGHT_THEME}
                />
            </div>
        </>
    }

    useEffect(() => {
        fetch(BASE_URL + "/buildings")
            .then(res => res.json())
            .then(
                (result) => {
                    setBuildings(result["buildings"]);
                    setShowRetry(false);
                },
                (error) => {
                    let timer = setTimeout(() => {
                        setShowRetry(true);
                        console.log('Error fetching, re-trying to fetch');
                        setErrorFetchedChecker((c: any) => !c);
                    }, 5000);

                    // clear Timeout
                    return () => {
                        clearTimeout(timer);
                    };
                }
            );
    }, [errorFetchedChecker]);

    useEffect(() => {
        fetch(BASE_URL + "/algorithms")
            .then(res => res.json())
            .then(
                (result) => {
                    setAlgorithms(result["algorithms"]);
                },
                (error) => {
                    setError(error);
                }
            )
    }, [])

    return (
        <React.StrictMode>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline enableColorScheme/>
                <div id="root-container">
                    <div id="grid-container">
                        <div id="config">
                            <Config
                                buildings={buildings}
                                selectedBuilding={building}
                                sensors={sensors}
                                selectedSensors={selectedSensors}
                                algorithms={algorithms}
                                selectedAlgorithm={algorithm}
                                calculating={calculatingAnomalies}
                                dateRange={dateRange}
                                onDateRangeChange={handleDateRangeChange}
                                findingEnabled={canFindAnomalies()}
                                onBuildingChange={handleBuildingChange}
                                onSensorChange={handleSensorChange}
                                onAlgorithmChange={handleAlgorithmChange}
                                onFindAnomalies={findAnomalies}
                                algoConfig={mockAlgoConfig}
                                algo_config_result={algoConfigResult}
                                onAlgoConfigChange={(id, value) => setAlgoConfigResult(r => {
                                    return {...r, [id]: value};
                                })}
                            />
                        </div>
                        <div id="raw-data">
                            <RawDataPlot
                                showRetry={showRetry}
                                showHint={building === "" || selectedSensors.length < 1}
                                timestamps={timestamps}
                                timeseries={timeseries}
                                sensors={selectedSensors}
                                additionalColors={ADD_GRAPH_COLORS}
                                lightTheme={LIGHT_THEME}
                            />
                        </div>
                        {anomalySection()}
                    </div>
                </div>
            </ThemeProvider>
        </React.StrictMode>
    );
}