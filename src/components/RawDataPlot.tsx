import * as React from "react";
import Plot from "react-plotly.js"
import {Alert, useTheme} from "@mui/material";
import {Sensor, TimeSeries} from "../App";

type RawDataProps = {
    showHint: boolean;
    timestamps: string[];
    timeseries: TimeSeries;
    sensors: Sensor[];
    additionalColors: string[];
    lightTheme: boolean;
}

const config = {responsive: true, displayModeBar: false}

function prepareLayout(colors: string[], lightTheme: boolean) {
    const theme = useTheme();
    let clrs = [theme.palette.primary.dark, theme.palette.secondary.dark];
    clrs.push(...colors);
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

function prepareData(timestamps: string[], timeseries: TimeSeries, sensors: Sensor[]) {
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

function renderPlot(timestamps: string[], timeseries: TimeSeries, sensors: Sensor[], colors: string[],
                    lightTheme: boolean) {
    return (
        <Plot
            data={prepareData(timestamps, timeseries, sensors)}
            layout={prepareLayout(colors, lightTheme)}
            config={config}
            style={{width: "100%", height: "100%"}}
        />
    );
}

function RawDataPlot(props: RawDataProps) {
    if (props.showHint) {
        return <Alert severity="info" variant="outlined">
            Please select both a building and a sensor.
        </Alert>
    }
    return renderPlot(props.timestamps, props.timeseries, props.sensors, props.additionalColors, props.lightTheme);
}

export default React.memo(RawDataPlot);
