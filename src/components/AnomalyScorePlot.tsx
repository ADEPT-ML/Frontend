import * as React from "react";
import {useTheme} from "@mui/material";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-basic-dist-min";

type AnomalyScoreProps = {
    timestamps: string[];
    errors: number[];
    threshold: number;
}

const config = {responsive: true, displayModeBar: false}

function prepareLayout(lightTheme: boolean) {
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
            zeroline: false
        },
        title: {
            font: {
                family: "Roboto, sans-serif",
                color: lightTheme ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
                size: 18
            },
            text: "Anomaly score and threshold"
        }
    } as const
}

function lineShape(threshold: number, color: string) {
    return ({
        type: "line",
        xref: "paper",
        x0: 0,
        x1: 1,
        yref: "y",
        y0: threshold,
        y1: threshold,
        line: {
            color: color,
            width: 2
        }
    } as const)
}

export default function AnomalyScorePlot(props: AnomalyScoreProps) {
    const theme = useTheme();
    const preparedLayout = prepareLayout(theme.palette.mode === "light");
    const Plot = createPlotlyComponent(Plotly);
    return (
        <Plot
            data={[
                {
                    x: props.timestamps,
                    y: props.errors,
                    type: 'scatter',
                    mode: 'lines',
                    line: {color: theme.palette.primary.dark}
                },
            ]}
            layout={{...preparedLayout, shapes: [lineShape(props.threshold, theme.palette.error.dark)]}}
            config={config}
            style={{width: "100%", height: "100%"}}
        />
    );
}
