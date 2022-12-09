import {FormControlLabel, FormGroup, Switch, Tooltip} from "@mui/material";
import * as React from "react";
import {ToggleSetting} from "./AlgorithmConfig";

type ConfigToggleProps = {
    setting: ToggleSetting;
    value: boolean;
    onChange: (id: string, value: boolean) => void;
    tooltipDelay: number;
}

export default function ConfigToggle(props: ConfigToggleProps) {
    return <Tooltip title={props.setting.docstring} enterDelay={props.tooltipDelay}>
        <FormGroup>
            <FormControlLabel
                control={
                    <Switch
                        checked={props.value}
                        onChange={e => props.onChange(props.setting.id, e.target.checked)}
                    />}
                label={props.setting.name}/>
        </FormGroup>
    </Tooltip>;
}
