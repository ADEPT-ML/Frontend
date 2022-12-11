import {Slider, Stack, TextField, Tooltip, Typography} from "@mui/material";
import * as React from "react";
import {NumericSetting, ValueType} from "./AlgorithmConfig";

type ConfigNumericProps = {
    setting: NumericSetting;
    value: number;
    tempValue: string;
    onChange: (id: string, value: ValueType) => void;
    onChangeTemp: (id: string, value: ValueType) => void;
    tooltipDelay: number;
}

export default function ConfigNumeric(props: ConfigNumericProps) {

    function validate(field_value: string): { result: boolean, msg?: string } {
        if (field_value === "") {
            return {result: false, msg: "Please enter a value."};
        }

        const float_regex = /^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/;
        if (!float_regex.test(field_value)) {
            return {result: false, msg: "Must be a number."};
        }

        const num_val = Number(field_value);

        if (props.setting.lowBound !== undefined && num_val < props.setting.lowBound) {
            return {result: false, msg: "Can not be less than " + props.setting.lowBound};
        }
        if (props.setting.highBound !== undefined && num_val > props.setting.highBound) {
            return {result: false, msg: "Can not be more than " + props.setting.highBound};
        }

        return {result: true};
    }

    function onFieldChange(field_value: string) {
        props.onChangeTemp(props.setting.id, field_value);
    }

    function onBlur(field_value: string) {
        if (!validate(props.tempValue).result) {
            props.onChangeTemp(props.setting.id, String(props.value));
        } else {
            let newVal: number = Number(field_value);
            newVal = Math.round(newVal / props.setting.step) * props.setting.step;
            props.onChangeTemp(props.setting.id, String(newVal));
            props.onChange(props.setting.id, newVal);
        }
    }

    if (props.setting.lowBound !== undefined && props.setting.highBound !== undefined) {
        const stepCount = (props.setting.highBound - props.setting.lowBound) / props.setting.step;
        if (stepCount <= 1000) {
            return <Tooltip title={props.setting.description} enterDelay={props.tooltipDelay}>
                <Stack direction={"row"} spacing={"15px"}>
                    <Typography marginTop={"3px"}>{props.setting.name}</Typography>
                    <Slider
                        value={props.value}
                        min={props.setting.lowBound}
                        max={props.setting.highBound}
                        step={props.setting.step}
                        onChange={(e, val) => props.onChange(props.setting.id, val as number)}
                        valueLabelDisplay="auto"/>
                </Stack>
            </Tooltip>
        }
    }

    const validation = validate(props.tempValue);

    return <Tooltip title={props.setting.description} enterDelay={props.tooltipDelay}>
        <TextField label={props.setting.name} variant={"outlined"} fullWidth
                   inputProps={{"maxLength": 10}}
                   onChange={e => onFieldChange(e.target.value)}
                   value={props.tempValue}
                   error={!validation.result}
                   helperText={validation.result ? null : validation.msg}
                   onBlur={e => onBlur(e.target.value)}
        />
    </Tooltip>
}