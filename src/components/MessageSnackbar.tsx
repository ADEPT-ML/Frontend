import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { AppState } from "../AppReducer";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

type SnackbarProps = {
    messageQueue: AppState["messageQueue"];
    onClose: () => void;
};

export default function MessageSnackbar(props: SnackbarProps) {
    return props.messageQueue.length === 0 ? null : (
        <Snackbar
            key={props.messageQueue[0].key}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            open={true}
            autoHideDuration={props.messageQueue[0].timeout || 6000}
            onClose={(_, reason) => {
                if (reason === "clickaway") return;
                props.onClose();
            }}
        >
            <Alert
                variant={"outlined"}
                onClose={props.onClose}
                severity={props.messageQueue[0].severity}
                sx={{ width: "100%",  bgcolor: "background.paper" }}
            >
                {props.messageQueue[0].message}
            </Alert>
        </Snackbar>
    );
}
