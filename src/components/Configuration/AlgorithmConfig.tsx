import * as React from "react";
import {
    Dialog,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    Tooltip
} from "@mui/material";
import {Close} from '@mui/icons-material';

type Setting = {
    id: string;
    name: string;
    docstring?: string;
}

type NumericSetting = Setting & {
    type: "Numeric";
    default: number;
    step: number;
    lowBound?: number;
    highBound?: number;
}

type ToggleSetting = Setting & {
    type: "Toggle";
    default: boolean;
}

type Option = {
    name: string;
    settings: (NumericSetting | ToggleSetting)[];
}

type OptionSetting = Setting & {
    type: "Option";
    default: string;
    options: Option[];
}

type AnySetting = NumericSetting | ToggleSetting | OptionSetting;

export type AlgorithmConfiguration = {
    settings: AnySetting[];
}

type ValueType = string | number | boolean

type AlgorithmConfigProps = {
    config: AlgorithmConfiguration;
    config_result: Record<string, ValueType>;
    isOpen: boolean;
    onClose: () => void;
    onChange: (id: string, value: ValueType) => void;
}

const tooltip_delay = 500;
const temp_suffix = "__temp__"

function buildToggle(setting: ToggleSetting, value: boolean, onChange: (id: string, value: boolean) => void) {
    return <Tooltip title={setting.docstring} enterDelay={tooltip_delay}>
        <FormGroup>
            <FormControlLabel
                control={
                    <Switch
                        checked={value}
                        onChange={e => onChange(setting.id, e.target.checked)}
                    />}
                label={setting.name}/>
        </FormGroup>
    </Tooltip>;
}

function buildNumeric(setting: NumericSetting, value: number, tempValue: string,
                      onChange: (id: string, value: ValueType) => void) {

    function changeTemp(newVal: string) {
        onChange(setting.id + temp_suffix, newVal);
    }

    function validate(field_value: string): { result: boolean, msg?: string } {
        if (field_value === "") {
            return {result: false, msg: "Please enter a value."};
        }

        const float_regex = /^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/;
        if (!float_regex.test(field_value)) {
            return {result: false, msg: "Must be a number."};
        }

        const num_val = Number(field_value);

        if (setting.lowBound !== undefined && num_val < setting.lowBound) {
            return {result: false, msg: "Can not be less than " + setting.lowBound};
        }
        if (setting.highBound !== undefined && num_val > setting.highBound) {
            return {result: false, msg: "Can not be more than " + setting.highBound};
        }

        return {result: true};
    }

    function onFieldChange(field_value: string) {
        changeTemp(field_value);
    }

    function onBlur(field_value: string) {
        if (!validate(tempValue).result) {
            changeTemp(String(value));
        } else {
            let newVal: number = Number(field_value);
            newVal = Math.round(newVal / setting.step) * setting.step;
            onChange(setting.id, newVal);
            changeTemp(String(newVal));
        }
    }

    const validation = validate(tempValue);

    return <Tooltip title={setting.docstring} enterDelay={tooltip_delay}>
        <TextField label={setting.name} variant={"outlined"} fullWidth
                   inputProps={{"maxlength": 10}}
                   onChange={e => onFieldChange(e.target.value)}
                   value={tempValue}
                   error={!validation.result}
                   helperText={validation.result ? null : validation.msg}
                   onBlur={e => onBlur(e.target.value)}
        />
    </Tooltip>
}

function buildOptionSetting(setting: OptionSetting,
                            result: Record<string, ValueType>, onChange: (id: string, value: ValueType) => void) {
    let elements = [];
    let settings = [];
    const value = result[setting.id] as string;
    for (const option of setting.options) {
        elements.push(<MenuItem key={option.name} value={option.name}>{option.name}</MenuItem>);
    }

    const selectedOption = setting.options.find(s => s.name === value)!;

    for (const sub_setting of selectedOption.settings) {
        if (sub_setting.type === "Toggle") {
            const element = buildToggle(sub_setting, result[sub_setting.id] as boolean, onChange);
            settings.push(<React.Fragment key={sub_setting.id}>{element}</React.Fragment>)
        } else if (sub_setting.type === "Numeric") {
            const element = buildNumeric(sub_setting, result[sub_setting.id] as number, result[sub_setting.id + temp_suffix] as string,
                onChange);
            settings.push(<React.Fragment key={sub_setting.id}>{element}</React.Fragment>);
        }
    }

    return <Stack spacing={"10px"}>
        <Tooltip title={setting.docstring} enterDelay={tooltip_delay}>
            <FormControl fullWidth>
                <InputLabel id={setting.id + "-label"}>{setting.name}</InputLabel>
                <Select labelId={setting.id + "-label"} id={setting.id} value={value} label={setting.name}
                        onChange={e => onChange(setting.id, e.target.value)}>
                    {elements}
                </Select>
            </FormControl>
        </Tooltip>
        {settings.length > 0 ? <Divider/> : null}
        {settings}
    </Stack>;
}

function buildMenu(config: AlgorithmConfiguration,
                   result: Record<string, ValueType>,
                   onChange: (id: string, value: ValueType) => void) {
    let elements = [];
    let keys: string[] = [];
    for (const setting of config.settings) {
        keys.push(setting.id);
        if (setting.type === "Toggle") {
            elements.push(buildToggle(setting, result[setting.id] as boolean, onChange));
        } else if (setting.type === "Numeric") {
            elements.push(buildNumeric(setting, result[setting.id] as number, result[setting.id + temp_suffix] as string, onChange));
        } else if (setting.type === "Option") {
            elements.push(buildOptionSetting(setting, result, onChange));
        }
    }

    return elements.map((e, index) =>
        <Paper key={keys[index]} elevation={4} sx={{padding: "15px", margin: "10px"}}>
            {e}
        </Paper>);
}

export function buildDefaultMap(config: AlgorithmConfiguration): Record<string, ValueType> {
    let result: Record<string, ValueType> = {};
    for (const setting of config.settings) {
        result[setting.id] = setting.default;
        if (setting.type === "Numeric") {
            result[setting.id + temp_suffix] = setting.default;
        }
        if (setting.type === "Option") {
            for (const option of setting.options) {
                for (const nested_setting of option.settings) {
                    result[nested_setting.id] = nested_setting.default;
                    if (nested_setting.type === "Numeric") {
                        result[nested_setting.id + temp_suffix] = nested_setting.default;
                    }
                }
            }
        }
    }
    return result;
}

export default function AlgorithmConfig(props: AlgorithmConfigProps) {
    return <Dialog open={props.isOpen} onClose={props.onClose} PaperProps={{elevation: 3, sx: {padding: "5px"}}}
                   fullWidth>
        <DialogTitle>Configure detection algorithm
            <IconButton
                sx={{
                    position: "absolute",
                    right: 10,
                    top: 18,
                }}
                onClick={props.onClose}>
                <Close/>
            </IconButton>
        </DialogTitle>
        <Divider/>
        {buildMenu(props.config, props.config_result, props.onChange)}
    </Dialog>;
}