import * as React from "react";
import {
    Checkbox,
    FormControl,
    IconButton,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    TextField,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Settings, Search, Check } from "@mui/icons-material";
import deLocale from "date-fns/locale/de";
import { Algorithm, Sensor } from "../../App";
import AlgorithmConfig from "./AlgorithmConfig";
import { useState } from "react";
import { AppState, isConfigDirty } from "../../AppReducer";

type ConfigProps = {
    state: AppState;
    onDateRangeChange: (start: Date | null, end: Date | null) => void;
    onBuildingChange: (buildingName: string) => void;
    onSensorChange: (selectedSensors: Sensor[]) => void;
    onAlgorithmChange: (newAlgorithm: Algorithm) => void;
    onFindAnomalies: () => void;
    onAlgoConfigChange: (id: string, value: string | number | boolean) => void;
};

function sensorSelected(sensors: Sensor[], s: Sensor) {
    return sensors.find((e) => e.type === s.type) !== undefined;
}

function multiSensorSelect(
    sensors: Sensor[],
    selectedSensors: Sensor[],
    disabled: boolean,
    onChange: (selectedSensors: Sensor[]) => void
) {
    return (
        <FormControl size={"small"}>
            <InputLabel id="sensor-label">Sensors</InputLabel>
            <Select
                labelId="sensor-label"
                id="sensor-select"
                label="Sensors"
                multiple
                value={selectedSensors.map((s) => JSON.stringify(s))}
                disabled={disabled}
                onChange={(e) => {
                    if (typeof e.target.value === "string") {
                        onChange([]);
                    } else {
                        onChange(e.target.value.map((s) => JSON.parse(s) as Sensor));
                    }
                }}
                renderValue={(selected) => selected.map((s) => (JSON.parse(s) as Sensor).type).join(", ")}
            >
                {sensors.map((sensor) => {
                    const selected = sensorSelected(selectedSensors, sensor);
                    return (
                        <MenuItem
                            key={sensor.type}
                            value={JSON.stringify(sensor)}
                            disabled={!selected && selectedSensors.length > 4}
                        >
                            <Checkbox checked={selected} />
                            <ListItemText primary={sensor.type} />
                        </MenuItem>
                    );
                })}
            </Select>
        </FormControl>
    );
}

function algoConfigVisible(props: ConfigProps): boolean {
    const selectedAlgorithm = props.state.config.selectedAlgorithm;
    return selectedAlgorithm !== null && selectedAlgorithm.config.settings.length > 0;
}

function canFindAnomalies(state: AppState): boolean {
    return (
        state.sensorFetchesPending === 0 &&
        state.config.selectedBuilding !== "" &&
        state.config.selectedSensors.length > 0 &&
        state.config.selectedAlgorithm !== null &&
        state.config.buildingDateRange.start !== null &&
        state.config.buildingDateRange.end !== null
    );
}

export default function Config(props: ConfigProps) {
    const [algorithmConfigOpen, setAlgorithmConfigOpen] = useState<boolean>(false);
    const configDirty = isConfigDirty(props.state);

    function setDate(value: Date | null, start: boolean) {
        if (start) {
            props.onDateRangeChange(value, props.state.config.buildingDateRange.end);
        } else {
            props.onDateRangeChange(props.state.config.buildingDateRange.start, value);
        }
    }

    const dateMask = "__.__.____";
    return (
        <>
            <Stack spacing={1} sx={{ width: "100%" }}>
                <FormControl size={"small"}>
                    <InputLabel id="building-label">Building</InputLabel>
                    <Select
                        labelId="building-label"
                        id="building-select"
                        label="Building"
                        value={props.state.config.selectedBuilding}
                        disabled={props.state.buildingNames.length === 0 || props.state.isWaitingForAnomalyResult}
                        onChange={(e) => props.onBuildingChange(e.target.value)}
                    >
                        {props.state.buildingNames.map((b) => (
                            <MenuItem value={b} key={b}>
                                {b}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {multiSensorSelect(
                    props.state.availableSensors,
                    props.state.config.selectedSensors,
                    props.state.availableSensors.length === 0 || props.state.isWaitingForAnomalyResult,
                    props.onSensorChange
                )}

                <Stack direction={"row"}>
                    <FormControl size={"small"} fullWidth>
                        <InputLabel id="model-label">Algorithm</InputLabel>
                        <Select
                            labelId="model-label"
                            id="model-select"
                            label="Algorithm"
                            value={
                                props.state.config.selectedAlgorithm
                                    ? JSON.stringify(props.state.config.selectedAlgorithm)
                                    : ""
                            }
                            disabled={
                                props.state.availableAlgorithms.length === 0 || props.state.isWaitingForAnomalyResult
                            }
                            onChange={(e) => props.onAlgorithmChange(JSON.parse(e.target.value) as Algorithm)}
                        >
                            {props.state.availableAlgorithms.map((a) => (
                                <MenuItem value={JSON.stringify(a)} key={a.id}>
                                    {a.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {!algoConfigVisible(props) ? null : (
                        <IconButton
                            sx={{ marginLeft: "-75px" }}
                            aria-label="Algorithm settings"
                            disabled={props.state.isWaitingForAnomalyResult}
                            onClick={() => setAlgorithmConfigOpen(true)}
                        >
                            <Settings />
                        </IconButton>
                    )}
                </Stack>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={deLocale}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <DatePicker
                            label="Start date"
                            value={props.state.config.buildingDateRange.start}
                            minDate={props.state.config.buildingDateRange.min}
                            maxDate={props.state.config.buildingDateRange.end}
                            disabled={
                                props.state.isWaitingForAnomalyResult ||
                                props.state.config.buildingDateRange.min === null
                            }
                            mask={dateMask}
                            onChange={(newValue) => {
                                setDate(newValue, true);
                            }}
                            renderInput={(params) => <TextField fullWidth size={"small"} {...params} />}
                        />
                        <DatePicker
                            label="End date"
                            value={props.state.config.buildingDateRange.end}
                            minDate={props.state.config.buildingDateRange.start}
                            maxDate={props.state.config.buildingDateRange.max}
                            disabled={
                                props.state.isWaitingForAnomalyResult ||
                                props.state.config.buildingDateRange.max === null
                            }
                            mask={dateMask}
                            onChange={(newValue) => {
                                setDate(newValue, false);
                            }}
                            renderInput={(params) => <TextField fullWidth size={"small"} {...params} />}
                        />
                    </Stack>
                </LocalizationProvider>

                <LoadingButton
                    disabled={!canFindAnomalies(props.state) || !configDirty}
                    loading={props.state.isWaitingForAnomalyResult}
                    loadingPosition="center"
                    variant="outlined"
                    onClick={props.onFindAnomalies}
                    startIcon={configDirty ? <Search /> : <Check />}
                >
                    {configDirty ? "Find Anomalies" : "Configuration unchanged"}
                </LoadingButton>
            </Stack>
            {algoConfigVisible(props) ? (
                <AlgorithmConfig
                    isOpen={algorithmConfigOpen}
                    onClose={() => setAlgorithmConfigOpen(false)}
                    setValue={props.onAlgoConfigChange}
                    config={props.state.config.selectedAlgorithm!.config}
                    getValue={(id) =>
                        props.state.config.algorithmConfigResult[props.state.config.selectedAlgorithm!.id]![id]
                    }
                />
            ) : null}
        </>
    );
}
