import * as React from "react";
import { useEffect, useState } from "react";
import Plotly, { Layout } from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import * as css from "./styles.module.css";
import { Alert, CircularProgress, Theme, useTheme } from "@mui/material";
import { Algorithm, UUID } from "../../App";
import { PlotConfig, PlotLayout } from "../PlotlyUtils";

type AttributionProps = {
    anomalyID: number;
    algorithm: Algorithm;
    networkFetch: (url: string | URL, action: (json: any) => void, onError: () => void, header: {}) => void;
};

type Attribution = {
    name: string;
    contribution: number;
};

function prepareLayout(theme: Theme): Partial<Layout> {
    const lightTheme: boolean = theme.palette.mode === "light";
    const colors = [theme.palette.primary.dark, theme.palette.secondary.dark, ...theme.additional_graph_colors];

    let layout = new PlotLayout(lightTheme)
        .withLineColors(colors)
        .withMargins({ l: 10, r: 0, b: 20, t: 0 })
        .withoutGrid()
        .withoutZoom()
        .with("barmode", "stack")
        .build();
    layout.yaxis!.showticklabels = false;
    return layout;
}

function FeatureAttributionPlot(props: AttributionProps) {
    const [attributions, setAttributions] = useState<Attribution[] | null>(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const options = {
        headers: new Headers({ uuid: `${UUID}` }),
    };

    useEffect(() => {
        if (props.anomalyID === 0 || !props.algorithm.explainable) return;
        setLoading(true);
        const url = "/calculate/feature-attribution?anomaly=" + props.anomalyID;
        const showAttribution = (result: any) => {
            let newAtts: Attribution[] = [];
            for (let a of result["attribution"]) {
                newAtts.push({
                    name: a["name"],
                    contribution: a["percent"],
                });
            }
            setAttributions(newAtts);
            setLoading(false);
        };

        props.networkFetch(url, showAttribution, () => setLoading(false), options);
    }, [props.anomalyID, props.algorithm]);

    function plotElement() {
        if (loading || attributions === null) return <CircularProgress />;
        const Plot = createPlotlyComponent(Plotly);
        return (
            <Plot
                data={attributions.map((a) => ({
                    x: [a.contribution],
                    y: [0],
                    orientation: "h",
                    type: "bar",
                    text: a.name,
                    insidetextanchor: "middle",
                    textposition: "inside",
                    name: a.name,
                    hovertemplate: "%{x:.2f}%",
                }))}
                layout={prepareLayout(theme)}
                config={PlotConfig}
                className={css.plot}
            />
        );
    }

    if (!props.algorithm.explainable) {
        return (
            <Alert severity="info" variant="outlined">
                The last used algorithm "{props.algorithm.name}" does not provide information about feature attribution.
            </Alert>
        );
    }
    if (props.anomalyID === 0) {
        return (
            <Alert severity="info" variant="outlined">
                Select an anomaly above to display information about feature attribution.
            </Alert>
        );
    }

    return (
        <div className={css.outerdiv}>
            <h2 className={css.heading}>Feature Attribution</h2>
            <div className={css.contentContainer}>{plotElement()}</div>
        </div>
    );
}

export default React.memo(FeatureAttributionPlot);
