import * as React from "react";
import {Dialog, DialogTitle, Divider, IconButton, Paper} from "@mui/material";
import {Close} from '@mui/icons-material';
import ConfigToggle from "./ConfigToggle";
import ConfigNumeric from "./ConfigNumeric";
import ConfigOption from "./ConfigOption";

type Setting = {
    id: string;
    name: string;
    docstring?: string;
}

export type NumericSetting = Setting & {
    type: "Numeric";
    default: number;
    step: number;
    lowBound?: number;
    highBound?: number;
}

export type ToggleSetting = Setting & {
    type: "Toggle";
    default: boolean;
}

type Option = {
    name: string;
    settings: (NumericSetting | ToggleSetting)[];
}

export type OptionSetting = Setting & {
    type: "Option";
    default: string;
    options: Option[];
}

type AnySetting = NumericSetting | ToggleSetting | OptionSetting;

export type AlgorithmConfiguration = {
    settings: AnySetting[];
}

export type ValueType = string | number | boolean

type AlgorithmConfigProps = {
    config: AlgorithmConfiguration;
    config_result: Record<string, ValueType>;
    isOpen: boolean;
    onClose: () => void;
    onChange: (id: string, value: ValueType) => void;
}

const tooltip_delay = 500;
const temp_suffix = "__temp__"

function buildMenu(config: AlgorithmConfiguration,
                   result: Record<string, ValueType>,
                   onChange: (id: string, value: ValueType) => void) {
    let elements = [];
    let keys: string[] = [];
    for (const setting of config.settings) {
        keys.push(setting.id);
        if (setting.type === "Toggle") {
            const toggle = <ConfigToggle setting={setting} value={result[setting.id] as boolean}
                                         onChange={onChange}
                                         tooltipDelay={tooltip_delay}/>;
            elements.push(toggle);
        } else if (setting.type === "Numeric") {
            const numeric = <ConfigNumeric setting={setting}
                                           value={result[setting.id] as number}
                                           tempValue={result[setting.id + temp_suffix] as string}
                                           onChange={onChange}
                                           onChangeTemp={((id, value) => onChange(id + temp_suffix, value))}
                                           tooltipDelay={tooltip_delay}/>;
            elements.push(numeric);
        } else if (setting.type === "Option") {
            const option = <ConfigOption setting={setting}
                                         result={result}
                                         onChange={onChange}
                                         onChangeTemp={((id, value) => onChange(id + temp_suffix, value))}
                                         getTempValue={(id) => result[id + temp_suffix] as string}
                                         tooltipDelay={tooltip_delay}/>;
            elements.push(option);
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