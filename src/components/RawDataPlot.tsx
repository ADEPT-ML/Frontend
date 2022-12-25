import * as React from "react";
import { useContext, useState } from "react";
import Plotly, { Layout, PlotData } from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import { Alert, Theme, useTheme } from "@mui/material";
import { DateRange, Sensor } from "../App";
import { PlotConfig, PlotLayout, rangeFromRelayoutEvent, ZoomHint } from "./PlotlyUtils";
import { MessagingContext } from "./MessagingContext";

type RawDataProps = {
    showHint: boolean;
    timestamps: string[];
    timeseries: Record<string, number[] | undefined>;
    sensors: Sensor[];
    zoomHintShown: boolean;
    dateRange: DateRange;
    onZoomHint: () => void;
};

function prepareLayout(theme: Theme, range: { x: string[]; y: string[] }): Partial<Layout> {
    const lightTheme: boolean = theme.palette.mode === "light";
    const colors = [theme.palette.primary.dark, theme.palette.secondary.dark, ...theme.additional_graph_colors];

    let layoutBuilder = new PlotLayout(lightTheme)
        .withTitle("Sensor data")
        .withLineColors(colors)
        .withMargins({ l: 20, r: 20, b: 30, t: 30 })
        .withLegend();
    let layout = layoutBuilder.build();

    layout.yaxis!.automargin = true;
    layout.xaxis!.range = range.x;
    layout.yaxis!.range = range.y;
    return layout;
}

function prepareData(
    timestamps: string[],
    timeseries: Record<string, number[] | undefined>,
    sensors: Sensor[]
): Partial<PlotData>[] {
    let result: Partial<PlotData>[] = [];
    for (let d of sensors) {
        if (timeseries[d.type] === undefined) {
            continue;
        } //Network request not yet done.
        result.push({
            x: timestamps,
            y: timeseries[d.type],
            type: "scatter",
            mode: "lines",
            name: d.type,
        });
    }
    return result;
}

function RawDataPlot(props: RawDataProps) {
    const theme = useTheme();
    const messageSink = useContext(MessagingContext);
    const [range, setRange] = useState<{ x: string[]; y: string[] }>({ x: [], y: [] });

    if (props.showHint) {
        return (
            <Alert severity="info" variant="outlined">
                Please select both a building and a sensor.
            </Alert>
        );
    }

    let layout = prepareLayout(theme, range);

    const dateRangeDefined = !Object.entries(props.dateRange).some((kv) => kv[1] === null);
    if (
        dateRangeDefined &&
        (props.dateRange.start! > props.dateRange.min! || props.dateRange.end! < props.dateRange.max!)
    ) {
        layout.shapes = [
            {
                type: "rect",
                xref: "x",
                x0: props.dateRange.start,
                x1: props.dateRange.end,
                yref: "paper",
                y0: 0,
                y1: 1,
                line: {
                    color: "rgba(255,255,255,0.9)",
                    width: 1,
                },
                fillcolor: "rgba(255,255,255,0.1)",
            },
        ];
    }

    const Plot = createPlotlyComponent(Plotly);
    return (
        <Plot
            data={prepareData(props.timestamps, props.timeseries, props.sensors)}
            layout={layout}
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

export default React.memo(RawDataPlot);
