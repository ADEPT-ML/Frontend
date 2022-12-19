import {Config, Layout, Margin} from "plotly.js-basic-dist-min";

export const PlotConfig: Partial<Config> = {responsive: true, displayModeBar: false}

export class PlotLayout {
    protected layout: Partial<Layout>;
    protected readonly lightMode: boolean;

    constructor(lightMode: boolean) {
        this.layout = {
            autosize: true,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            xaxis: {
                gridcolor: lightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                color: lightMode ? "rgba(0,0,0,1.0)" : "rgba(255,255,255,1.0)",
                zeroline: false
            },
            yaxis: {
                gridcolor: lightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                color: lightMode ? "rgba(0,0,0,1.0)" : "rgba(255,255,255,1.0)",
                zeroline: false
            },
            showlegend: false
        }
        this.lightMode = lightMode;
    }

    public withTitle(title: string): PlotLayout {
        this.layout = {
            ...this.layout, title: {
                font: {
                    family: "Roboto, sans-serif",
                    color: this.lightMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
                    size: 18
                },
                text: title
            }
        }
        return this;
    }

    public withMargins(margins: Partial<Margin>): PlotLayout {
        this.layout = {...this.layout, margin: margins};
        return this;
    }

    public withLineColors(colors: string[]): PlotLayout {
        this.layout = {...this.layout, colorway: colors};
        return this;
    }

    public withLegend(): PlotLayout {
        this.layout = {
            ...this.layout,
            showlegend: true,
            legend: {
                font: {
                    color: this.lightMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)"
                }
            }
        }
        return this;
    }

    public withSubXAxis(name: "xaxis" | "xaxis2" | "xaxis3", domain: number[]): PlotLayout {
        this.layout = {...this.layout, [name]: {...this.layout.xaxis, domain: domain}};
        return this;
    }

    public withoutGrid(): PlotLayout {
        this.layout = {
            ...this.layout,
            xaxis: {...this.layout.xaxis, showgrid: false},
            yaxis: {...this.layout.yaxis, showgrid: false}
        };
        return this;
    }

    public withoutZoom(): PlotLayout {
        this.layout = {
            ...this.layout,
            xaxis: {...this.layout.xaxis, fixedrange: true},
            yaxis: {...this.layout.yaxis, fixedrange: true}
        };
        return this;
    }

    public withoutTicklabels(): PlotLayout {
        this.layout = {
            ...this.layout,
            xaxis: {...this.layout.xaxis, showticklabels: false},
            yaxis: {...this.layout.yaxis, showticklabels: false}
        };
        return this;
    }

    public with<Key extends keyof Layout>(key: Key, value: Layout[Key]) {
        this.layout = {...this.layout, [key]: value};
        return this;
    }

    public build(): Partial<Layout> {
        return this.layout;
    }
}
