import {Divider, FormControl, InputLabel, MenuItem, Select, Stack, Tooltip} from "@mui/material";
import ConfigToggle from "./ConfigToggle";
import ConfigNumeric from "./ConfigNumeric";
import * as React from "react";
import {OptionSetting, ValueType} from "./AlgorithmConfig";

type ConfigOptionProps = {
    setting: OptionSetting;
    result: Record<string, ValueType>;
    onChange: (id: string, value: ValueType) => void;
    onChangeTemp: (id: string, value: ValueType) => void;
    getTempValue: (id: string) => string;
    tooltipDelay: number;
}

export default function ConfigOption(props: ConfigOptionProps) {
    let elements = [];
    let settings = [];
    const value = props.result[props.setting.id] as string;
    for (const option of props.setting.options) {
        elements.push(<MenuItem key={option.name} value={option.name}>{option.name}</MenuItem>);
    }

    const selectedOption = props.setting.options.find(s => s.name === value)!;

    for (const sub_setting of selectedOption.settings) {
        if (sub_setting.type === "Toggle") {
            const toggle = <ConfigToggle key={sub_setting.id} setting={sub_setting}
                                         value={props.result[sub_setting.id] as boolean}
                                         onChange={props.onChange} tooltipDelay={props.tooltipDelay}/>;
            settings.push(toggle);
        } else if (sub_setting.type === "Numeric") {
            const numeric = <ConfigNumeric key={sub_setting.id} setting={sub_setting}
                                           value={props.result[sub_setting.id] as number}
                                           tempValue={props.getTempValue(sub_setting.id)}
                                           onChange={props.onChange}
                                           onChangeTemp={props.onChangeTemp}
                                           tooltipDelay={props.tooltipDelay}/>
            settings.push(numeric);
        }
    }

    return <Stack spacing={"10px"}>
        <Tooltip title={props.setting.docstring} enterDelay={props.tooltipDelay}>
            <FormControl fullWidth>
                <InputLabel id={props.setting.id + "-label"}>{props.setting.name}</InputLabel>
                <Select labelId={props.setting.id + "-label"} id={props.setting.id} value={value}
                        label={props.setting.name}
                        onChange={e => props.onChange(props.setting.id, e.target.value)}>
                    {elements}
                </Select>
            </FormControl>
        </Tooltip>
        {settings.length > 0 ? <Divider/> : null}
        {settings}
    </Stack>;
}