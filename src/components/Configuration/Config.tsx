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
    TextField
} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {Settings} from '@mui/icons-material';
import deLocale from 'date-fns/locale/de';
import {Algorithm, DateRange, Sensor} from "../../App";
import AlgorithmConfig, {AlgorithmConfiguration} from "./AlgorithmConfig";
import {useState} from "react";

type ConfigProps = {
    selectedBuilding: string;
    buildings: string[];
    selectedSensors: Sensor[];
    sensors: Sensor[];
    selectedAlgorithm: Algorithm | null;
    algorithms: Algorithm[];
    calculating: boolean;
    findingEnabled: boolean;
    dateRange: DateRange;
    onDateRangeChange: (start: Date | null, end: Date | null) => void;
    onBuildingChange: (buildingName: string) => void;
    onSensorChange: (selectedSensors: Sensor[]) => void;
    onAlgorithmChange: (newAlgorithm: Algorithm) => void;
    onFindAnomalies: () => void;
    algoConfig: AlgorithmConfiguration | null;
    algo_config_result: Record<string, string | number | boolean> | null;
    onAlgoConfigChange: (id: string, value: string | number | boolean) => void;
}

function sensorSelected(sensors: Sensor[], s: Sensor) {
    return sensors.find(e => e.type === s.type) !== undefined;
}

function multiSensorSelect(sensors: Sensor[], selectedSensors: Sensor[], disabled: boolean,
                           onChange: (selectedSensors: Sensor[]) => void) {
    return <FormControl size={"small"}>
        <InputLabel id="sensor-label">Sensors</InputLabel>
        <Select
            labelId="sensor-label"
            id="sensor-select"
            label="Sensors"
            multiple
            value={selectedSensors.map(s => JSON.stringify(s))}
            disabled={disabled}
            onChange={(e) => {
                if (typeof e.target.value === "string") {
                    onChange([]);
                } else {
                    onChange(e.target.value.map(s => JSON.parse(s) as Sensor));
                }
            }}
            renderValue={(selected) => selected.map(s => (JSON.parse(s) as Sensor).type).join(', ')}
        >
            {sensors.map((sensor) => {
                const selected = sensorSelected(selectedSensors, sensor);
                return <MenuItem key={sensor.type} value={JSON.stringify(sensor)}
                                 disabled={!selected && selectedSensors.length > 4}>
                    <Checkbox checked={selected}/>
                    <ListItemText primary={sensor.type}/>
                </MenuItem>
            })}
        </Select>
    </FormControl>
}

function algoConfigVisible(props: ConfigProps): boolean {
    return props.algoConfig !== null && props.algoConfig.settings.length > 0;
}

export default function Config(props: ConfigProps) {
    const [algorithmConfigOpen, setAlgorithmConfigOpen] = useState<boolean>(false);

    function setDate(value: Date | null, start: boolean) {
        if (start) {
            props.onDateRangeChange(value, props.dateRange.end);
        } else {
            props.onDateRangeChange(props.dateRange.start, value);
        }
    }

    const dateMask = "__.__.____";
    return <>
        <Stack spacing={1} sx={{width: "100%"}}>
            <FormControl size={"small"}>
                <InputLabel id="building-label">Building</InputLabel>
                <Select
                    labelId="building-label"
                    id="building-select"
                    label="Building"
                    value={props.selectedBuilding}
                    disabled={props.buildings.length === 0 || props.calculating}
                    onChange={e => props.onBuildingChange(e.target.value)}
                >
                    {props.buildings.map(b => <MenuItem value={b} key={b}>{b}</MenuItem>)}
                </Select>
            </FormControl>

            {multiSensorSelect(props.sensors, props.selectedSensors,
                props.sensors.length === 0 || props.calculating, props.onSensorChange)}

            <Stack direction={"row"}>
                <FormControl size={"small"} fullWidth>
                    <InputLabel id="model-label">Algorithm</InputLabel>
                    <Select
                        labelId="model-label"
                        id="model-select"
                        label="Algorithm"
                        value={props.selectedAlgorithm ? JSON.stringify(props.selectedAlgorithm) : ""}
                        disabled={props.algorithms.length === 0 || props.calculating}
                        onChange={e => props.onAlgorithmChange(JSON.parse(e.target.value) as Algorithm)}
                    >
                        {props.algorithms.map(a => <MenuItem value={JSON.stringify(a)} key={a.id}>{a.name}</MenuItem>)}
                    </Select>
                </FormControl>
                {!algoConfigVisible(props) ? null :
                    <IconButton sx={{"marginLeft": "-75px"}} aria-label="Algorithm settings"
                                disabled={props.calculating}
                                onClick={() => setAlgorithmConfigOpen(true)}>
                        <Settings/>
                    </IconButton>
                }
            </Stack>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={deLocale}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <DatePicker
                        label="Start date"
                        value={props.dateRange.start}
                        minDate={props.dateRange.min}
                        maxDate={props.dateRange.end}
                        disabled={props.calculating || props.dateRange.min === null}
                        mask={dateMask}
                        onChange={(newValue) => {
                            setDate(newValue, true);
                        }}
                        renderInput={(params) => <TextField fullWidth size={"small"} {...params} />}
                    />
                    <DatePicker
                        label="End date"
                        value={props.dateRange.end}
                        minDate={props.dateRange.start}
                        maxDate={props.dateRange.max}
                        disabled={props.calculating || props.dateRange.max === null}
                        mask={dateMask}
                        onChange={(newValue) => {
                            setDate(newValue, false);
                        }}
                        renderInput={(params) => <TextField fullWidth size={"small"} {...params} />}
                    />
                </Stack>
            </LocalizationProvider>

            <LoadingButton
                disabled={!props.findingEnabled}
                loading={props.calculating}
                loadingPosition="center"
                variant="outlined"
                onClick={props.onFindAnomalies}
            >
                Find Anomalies
            </LoadingButton>
        </Stack>
        {algoConfigVisible(props) ?
            <AlgorithmConfig
                isOpen={algorithmConfigOpen}
                onClose={() => setAlgorithmConfigOpen(false)}
                setValue={props.onAlgoConfigChange}
                config={props.algoConfig!}
                getValue={(id) => props.algo_config_result![id]}/> : null
        }

    </>
}
