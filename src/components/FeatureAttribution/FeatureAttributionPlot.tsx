import * as React from "react";
import {useEffect, useState} from "react";
import Plot from "react-plotly.js";
import * as css from "./styles.module.css"
import {Alert, CircularProgress, Theme, useTheme} from "@mui/material";
import {Algorithm} from "../../App";

type AttributionProps = {
    anomalyID: number;
    baseURL: string;
    algorithm: Algorithm
    additionalColors: string[];
    lightTheme: boolean;
}

type Attribution = {
    name: string;
    contribution: number;
}

const plotConfig = {responsive: true, displayModeBar: false}

function prepareLayout(theme: Theme, colors: string[], lightTheme: boolean) {
    let clrs = [theme.palette.primary.dark, theme.palette.secondary.dark];
    clrs.push(...colors);
    return {
        autosize: true,
        margin: {l: 10, r: 0, b: 20, t: 0},
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: {
            color: lightTheme ? "rgba(0,0,0,1.0)" : "rgba(255,255,255,1.0)",
            showgrid: false,
            zeroline: false,
            fixedrange: true
        },
        yaxis: {
            showgrid: false,
            zeroline: false,
            fixedrange: true,
            showticklabels: false
        },
        barmode: "stack",
        showlegend: false,
        colorway: clrs
    } as const
}

function FeatureAttributionPlot(props: AttributionProps) {
    const [attributions, setAttributions] = useState<Attribution[] | null>(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const options = {
        headers: new Headers({'uuid': `${localStorage.getItem("uuid")}`})
    }

    useEffect(() => {
        if (props.anomalyID === 0 || !props.algorithm.explainable) return;
        setLoading(true);
        fetch(props.baseURL + "/calculate/feature-attribution?anomaly=" + props.anomalyID, options)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                setLoading(false);
                return res.json();
            })
            .then(
                (result) => {
                    let newAtts: Attribution[] = [];
                    for (let a of result["attribution"]) {
                        newAtts.push({
                            name: a["name"],
                            contribution: a["percent"]
                        })
                    }
                    setAttributions(newAtts);
                },
                (error) => {
                }
            )
    }, [props.anomalyID, props.algorithm]);

    function plotElement() {
        if (loading || attributions === null) return <CircularProgress/>;
        return <Plot
            data={attributions.map(a => ({
                x: [a.contribution],
                y: [0],
                orientation: 'h',
                type: 'bar',
                text: a.name,
                insidetextanchor: "middle",
                textposition: "inside",
                name: a.name,
                hovertemplate: "%{x:.2f}%"
            }))}
            layout={prepareLayout(theme, props.additionalColors, props.lightTheme)}
            config={plotConfig}
            className={css.plot}
        />
    }

    if (!props.algorithm.explainable) {
        return <Alert severity="info" variant="outlined" className={css.alert}>
            The selected algorithm does not provide information about feature attribution.
        </Alert>
    }
    if (props.anomalyID === 0) {
        return <Alert severity="info" variant="outlined" className={css.alert}>
            Select an anomaly above to display information about feature attribution.
        </Alert>
    }

    return (
        <div className={css.outerdiv}>
            <h2 className={css.heading}>Feature Attribution</h2>
            <div className={css.contentContainer}>
                {plotElement()}
            </div>
        </div>
    );
}

export default React.memo(FeatureAttributionPlot);
