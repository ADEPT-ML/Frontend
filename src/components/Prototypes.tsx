import * as React from "react";
import {useEffect, useState} from "react";
import Plotly from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import {Alert, CircularProgress, useTheme} from "@mui/material";

type PrototypesProps = {
    anomalyID: number;
    baseURL: string;
    uuid: string;
    networkFetch: (url: string | URL, action: (json: JSON) => void, onError: () => void, header: {}) => void;
}

type PrototypeResponse = {
    prototype_a: number[];
    prototype_b: number[];
    anomaly: number[];
}

const plotConfig = {responsive: true, displayModeBar: false}

function yaxisTemplate(lightTheme: boolean) {
    return {
        gridcolor: lightTheme ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
        color: lightTheme ? "rgba(0,0,0,1.0)" : "rgba(255,255,255,1.0)",
        zeroline: false,
        fixedrange: true,
        showticklabels: false
    } as const
}

function xaxisTemplate(domain: number[], lightTheme: boolean) {
    return {...yaxisTemplate(lightTheme), domain: domain};
}

function prepareLayout(lightTheme: boolean) {
    return {
        autosize: true,
        margin: {l: 20, r: 20, b: 0, t: 30},
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        showlegend: false,
        xaxis: xaxisTemplate([0, 0.3], lightTheme),
        xaxis2: xaxisTemplate([0.35, 0.65], lightTheme),
        xaxis3: xaxisTemplate([0.7, 1], lightTheme),
        yaxis: yaxisTemplate(lightTheme),
        grid: {rows: 1, columns: 3, pattern: 'independent'},
        title: {
            font: {
                family: "Roboto, sans-serif",
                color: lightTheme ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
                size: 18
            },
            text: "Example-based explanation"
        }
    } as const
}

function indexArray(cnt: Number) {
    let result: number[] = [];
    for (let i = 0; i < cnt; i++) {
        result.push(i);
    }
    return result;
}

function makeData(color: string, data: number[], axis_x: string, axis_y: string) {
    return {
        x: indexArray(data.length),
        y: data,
        type: 'scatter',
        mode: 'lines',
        line: {color: color},
        xaxis: axis_x,
        yaxis: axis_y,
        hoverinfo: "skip"
    } as const
}

function Prototypes(props: PrototypesProps) {
    const [pData, setPData] = useState<PrototypeResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const options = {
        headers: new Headers({'uuid': `${props.uuid}`})
    }

    useEffect(() => {
        if (props.anomalyID === 0) return;
        setLoading(true);
        const url = "/calculate/prototypes?anomaly=" + props.anomalyID;
        const action = (result: any) => {
            const ptypes = result["prototypes"];
            setPData({
                prototype_a: ptypes["prototype a"],
                prototype_b: ptypes["prototype b"],
                anomaly: ptypes["anomaly"]
            });
            setLoading(false);
        }
        props.networkFetch(url, action, () => setLoading(false), options);
    }, [props.anomalyID]);

    if (props.anomalyID === 0) return <Alert severity="info" variant="outlined">
        Please select an anomaly above to display an example-based explanation.
    </Alert>;
    if (loading || pData === null) return <CircularProgress/>;
    const Plot = createPlotlyComponent(Plotly);
    return (
        <Plot
            data={[
                makeData(theme.palette.primary.dark, pData.prototype_a, "x1", "y1"),
                makeData(theme.palette.primary.dark, pData.prototype_b, "x2", "y1"),
                makeData(theme.palette.error.dark, pData.anomaly, "x3", "y1")
            ]}
            layout={prepareLayout(theme.palette.mode === "light")}
            config={plotConfig}
            style={{width: "100%", height: "100%"}}
        />
    );
}

export default React.memo(Prototypes);