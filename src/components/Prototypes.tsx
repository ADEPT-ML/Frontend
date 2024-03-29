import * as React from "react";
import { useEffect, useState } from "react";
import Plotly, { Layout, PlotData } from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import { Alert, CircularProgress, useTheme } from "@mui/material";
import { PlotConfig, PlotLayout } from "./PlotlyUtils";
import { UUID } from "../App";

type PrototypesProps = {
    anomalyID: number;
    networkFetch: (url: string | URL, action: (json: any) => void, onError: () => void, header: {}) => void;
};

type PrototypeResponse = {
    prototype_a: number[];
    prototype_b: number[];
    anomaly: number[];
};

function prepareLayout(lightTheme: boolean, range: number[]): Partial<Layout> {
    return new PlotLayout(lightTheme)
        .withTitle("Example-based explanation")
        .withMargins({ l: 20, r: 20, b: 0, t: 30 })
        .withYRange(range)
        .withoutZoom()
        .withoutTicklabels()
        .with("grid", { rows: 1, columns: 3, pattern: "independent" })
        .withSubXAxis("xaxis", [0, 0.3])
        .withSubXAxis("xaxis2", [0.35, 0.65])
        .withSubXAxis("xaxis3", [0.7, 1])
        .build();
}

function indexArray(cnt: number) {
    let result: number[] = [];
    for (let i = 0; i < cnt; i++) {
        result.push(i);
    }
    return result;
}

function makeData(color: string, data: number[], axis_x: string, axis_y: string): Partial<PlotData> {
    return {
        x: indexArray(data.length),
        y: data,
        type: "scatter",
        mode: "lines",
        line: { color: color },
        xaxis: axis_x,
        yaxis: axis_y,
        hoverinfo: "skip",
    };
}

function Prototypes(props: PrototypesProps) {
    const [pData, setPData] = useState<PrototypeResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const options = {
        headers: new Headers({ uuid: `${UUID}` }),
    };

    useEffect(() => {
        if (props.anomalyID === 0) return;
        setLoading(true);
        const url = "/calculate/prototypes?anomaly=" + props.anomalyID;
        const action = (result: any) => {
            const ptypes = result["prototypes"];
            setPData({
                prototype_a: ptypes["prototype a"],
                prototype_b: ptypes["prototype b"],
                anomaly: ptypes["anomaly"],
            });
            setLoading(false);
        };
        props.networkFetch(url, action, () => setLoading(false), options);
    }, [props.anomalyID]);

    if (props.anomalyID === 0)
        return (
            <Alert severity="info" variant="outlined">
                Please select an anomaly above to display an example-based explanation.
            </Alert>
        );
    if (loading || pData === null) return <CircularProgress />;

    const values = [...pData.prototype_a, ...pData.prototype_b, ...pData.anomaly];
    const valuesNoNaN = values.filter((x) => x !== null);
    const maxY = Math.max(...valuesNoNaN);
    const minY = Math.min(...valuesNoNaN);

    const Plot = createPlotlyComponent(Plotly);
    return (
        <Plot
            data={[
                makeData(theme.palette.primary.dark, pData.prototype_a, "x1", "yaxis"),
                makeData(theme.palette.primary.dark, pData.prototype_b, "x2", "yaxis"),
                makeData(theme.palette.error.dark, pData.anomaly, "x3", "yaxis"),
            ]}
            layout={prepareLayout(theme.palette.mode === "light", [minY, maxY])}
            config={{ ...PlotConfig, staticPlot: true }}
            style={{ width: "100%", height: "100%" }}
        />
    );
}

export default React.memo(Prototypes);
