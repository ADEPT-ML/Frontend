import * as React from "react";
import { useTheme } from "@mui/material";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly, { Layout, Shape } from "plotly.js-basic-dist-min";
import { PlotConfig, PlotLayout } from "./PlotlyUtils";

type AnomalyScoreProps = {
    timestamps: string[];
    errors: number[];
    threshold: number;
};

function prepareLayout(lightTheme: boolean): Partial<Layout> {
    return new PlotLayout(lightTheme)
        .withTitle("Anomaly score and threshold")
        .withMargins({ l: 20, r: 20, b: 30, t: 30 })
        .build();
}

function lineShape(threshold: number, color: string): Partial<Shape> {
    return {
        type: "line",
        xref: "paper",
        x0: 0,
        x1: 1,
        yref: "y",
        y0: threshold,
        y1: threshold,
        line: {
            color: color,
            width: 2,
        },
    };
}

function AnomalyScorePlot(props: AnomalyScoreProps) {
    const theme = useTheme();
    const preparedLayout = prepareLayout(theme.palette.mode === "light");
    const Plot = createPlotlyComponent(Plotly);
    return (
        <Plot
            data={[
                {
                    x: props.timestamps,
                    y: props.errors,
                    type: "scatter",
                    mode: "lines",
                    line: { color: theme.palette.primary.dark },
                },
            ]}
            layout={{ ...preparedLayout, shapes: [lineShape(props.threshold, theme.palette.error.dark)] }}
            config={PlotConfig}
            style={{ width: "100%", height: "100%" }}
        />
    );
}

export default React.memo(AnomalyScorePlot);