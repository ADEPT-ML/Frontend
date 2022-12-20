import * as React from "react";
import Plotly, {Layout, PlotData} from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import {Alert, Theme, useTheme} from "@mui/material";
import {Sensor} from "../App";
import {PlotConfig, PlotLayout} from "./PlotlyUtils";

type RawDataProps = {
    showHint: boolean;
    timestamps: string[];
    timeseries: Record<string, number[] | undefined>;
    sensors: Sensor[];
}

function prepareLayout(theme: Theme): Partial<Layout> {
    const lightTheme: boolean = theme.palette.mode === "light";
    const colors = [theme.palette.primary.dark, theme.palette.secondary.dark, ...theme.additional_graph_colors];

    let layout = new PlotLayout(lightTheme).withTitle("Sensor data").withLineColors(colors)
        .withMargins({l: 20, r: 20, b: 30, t: 30}).withLegend().build();
    layout.yaxis!.automargin = true;
    return layout;
}

function prepareData(timestamps: string[], timeseries: Record<string, number[] | undefined>,
                     sensors: Sensor[]): Partial<PlotData>[] {
    let result: Partial<PlotData>[] = [];
    for (let d of sensors) {
        if (timeseries[d.type] === undefined) {
            continue;
        } //Network request not yet done.
        result.push({
            x: timestamps,
            y: timeseries[d.type],
            type: 'scatter',
            mode: 'lines',
            name: d.type
        })
    }
    return result;
}

function renderPlot(timestamps: string[], timeseries: Record<string, number[] | undefined>, sensors: Sensor[],
                    theme: Theme) {
    const Plot = createPlotlyComponent(Plotly);
    return (
        <Plot
            data={prepareData(timestamps, timeseries, sensors)}
            layout={prepareLayout(theme)}
            config={PlotConfig}
            style={{width: "100%", height: "100%"}}
        />
    );
}

function RawDataPlot(props: RawDataProps) {
    const theme = useTheme();
    if (props.showHint) {
        return <Alert severity="info" variant="outlined">
            Please select both a building and a sensor.
        </Alert>
    }
    return renderPlot(props.timestamps, props.timeseries, props.sensors, theme);
}

export default React.memo(RawDataPlot);
