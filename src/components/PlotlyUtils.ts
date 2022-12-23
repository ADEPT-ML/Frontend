import { Config, Layout, Margin, PlotRelayoutEvent } from "plotly.js-basic-dist-min";

export const PlotConfig: Partial<Config> = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: true,
    showTips: false,
};

export const ZoomHint: string = "Double-click the plot to reset the zoom";

export class PlotLayout {
    protected layout: Partial<Layout>;
    protected readonly lightMode: boolean;

    constructor(lightMode: boolean) {
        this.lightMode = lightMode;
        this.layout = {
            autosize: true,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            xaxis: {
                gridcolor: lightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                color: lightMode ? "rgba(0,0,0,1.0)" : "rgba(255,255,255,1.0)",
                zeroline: false,
            },
            yaxis: {
                gridcolor: lightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                color: lightMode ? "rgba(0,0,0,1.0)" : "rgba(255,255,255,1.0)",
                zeroline: false,
            },
            showlegend: false,
            font: {
                family: "Roboto, sans-serif",
            },
        };
    }

    public withTitle(title: string): PlotLayout {
        this.layout.title = {
            font: {
                color: this.lightMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
                size: 18,
            },
            text: title,
        };
        return this;
    }

    public withMargins(margins: Partial<Margin>): PlotLayout {
        this.layout.margin = margins;
        return this;
    }

    public withYRange(range: number[]): PlotLayout {
        this.layout.yaxis!.range = range;
        return this;
    }

    public withLineColors(colors: string[]): PlotLayout {
        this.layout.colorway = colors;
        return this;
    }

    public withLegend(): PlotLayout {
        this.layout.showlegend = true;
        this.layout.legend = {
            font: {
                color: this.lightMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
            },
        };
        return this;
    }

    public withSubXAxis(name: "xaxis" | "xaxis2" | "xaxis3", domain: number[]): PlotLayout {
        this.layout[name] = { ...this.layout.xaxis, domain: domain };
        return this;
    }

    public withoutGrid(): PlotLayout {
        this.layout.xaxis!.showgrid = false;
        this.layout.yaxis!.showgrid = false;
        return this;
    }

    public withoutZoom(): PlotLayout {
        this.layout.xaxis!.fixedrange = true;
        this.layout.yaxis!.fixedrange = true;
        return this;
    }

    public withoutTicklabels(): PlotLayout {
        this.layout.xaxis!.showticklabels = false;
        this.layout.yaxis!.showticklabels = false;
        return this;
    }

    public with<Key extends keyof Layout>(key: Key, value: Layout[Key]) {
        this.layout[key] = value;
        return this;
    }

    public build(): Partial<Layout> {
        return this.layout;
    }
}

export function rangeFromRelayoutEvent(
    e: PlotRelayoutEvent,
    oldRange: { x: string[]; y: string[] }
): { x: string[]; y: string[] } {
    let newRange = { ...oldRange };
    if (e["xaxis.autorange"] !== undefined) {
        newRange = { ...newRange, x: [] };
    }
    if (e["yaxis.autorange"] !== undefined) {
        newRange = { ...newRange, y: [] };
    }
    if (e["xaxis.range[0]"] !== undefined) {
        newRange = { ...newRange, x: [e["xaxis.range[0]"] as any, e["xaxis.range[1]"] as any] };
    }
    if (e["yaxis.range[0]"] !== undefined) {
        newRange = { ...newRange, y: [e["yaxis.range[0]"] as any, e["yaxis.range[1]"] as any] };
    }
    return newRange;
}
