import * as React from "react";
import { useContext, useState } from "react";
import { useTheme } from "@mui/material";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly, { Layout, Shape } from "plotly.js-basic-dist-min";
import { PlotConfig, PlotLayout, rangeFromRelayoutEvent, ZoomHint } from "./PlotlyUtils";
import { MessagingContext } from "./MessagingContext";

type AnomalyScoreProps = {
    timestamps: string[];
    errors: number[];
    threshold: number;
    zoomHintShown: boolean;
    onZoomHint: () => void;
};

function prepareLayout(lightTheme: boolean, range: { x: string[]; y: string[] }): Partial<Layout> {
    let layout = new PlotLayout(lightTheme)
        .withTitle("Anomaly score and threshold")
        .withMargins({ l: 20, r: 20, b: 30, t: 30 })
        .build();
    layout.xaxis!.range = range.x;
    layout.yaxis!.range = range.y;
    return layout;
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
    const messageSink = useContext(MessagingContext);
    const [range, setRange] = useState<{ x: string[]; y: string[] }>({ x: [], y: [] });

    const preparedLayout = prepareLayout(theme.palette.mode === "light", range);
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
            onRelayout={(e) => {
                setRange(rangeFromRelayoutEvent(e, range));
                if (e["xaxis.autorange"] === undefined && !props.zoomHintShown) {
                    messageSink({ severity: "info", message: ZoomHint, timeout: 4000 });
                    props.onZoomHint();
                }
            }}
        />
    );
}

export default React.memo(AnomalyScorePlot);
