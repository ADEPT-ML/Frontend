import * as React from "react";
import Plotly from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import {Alert, Theme, useTheme} from "@mui/material";
import {Sensor} from "../App";

type RawDataProps = {
    showHint: boolean;
    timestamps: string[];
    timeseries: Record<string, number[] | undefined>;
    sensors: Sensor[];
}

const config = {responsive: true, displayModeBar: false}

function prepareLayout(theme: Theme) {
    const lightTheme: boolean = theme.palette.mode === "light";
    let clrs = [theme.palette.primary.dark, theme.palette.secondary.dark];
    clrs.push(...theme.additional_graph_colors);
    return {
        autosize: true,
        margin: {l: 20, r: 20, b: 30, t: 30},
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: {
            gridcolor: lightTheme ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
            color: lightTheme ? "rgba(0,0,0,1.0)" : "rgba(255,255,255,1.0)",
            zeroline: false
        },
        yaxis: {
            gridcolor: lightTheme ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
            color: lightTheme ? "rgba(0,0,0,1.0)" : "rgba(255,255,255,1.0)",
            zeroline: false,
            automargin: true
        },
        title: {
            font: {
                family: "Roboto, sans-serif",
                color: lightTheme ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
                size: 18
            },
            text: "Sensor data"
        },
        legend: {
            font: {
                color: lightTheme ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)"
            }
        },
        colorway: clrs
    }
}

function prepareData(timestamps: string[], timeseries: Record<string, number[] | undefined>, sensors: Sensor[]) {
    let result = [];
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
        } as const)
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
            config={config}
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
