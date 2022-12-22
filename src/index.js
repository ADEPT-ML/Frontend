import ReactDOM from "react-dom/client";
import * as React from "react";
import { App } from "./App";

const app = document.getElementById("root");
const root = ReactDOM.createRoot(app);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
