import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { AlertColor } from "@mui/material";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

type SnackbarProps = {
    severity: AlertColor;
    message: string;
    onClose: () => void;
};

export default function ErrorSnackbar(props: SnackbarProps) {
    return (
        <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            open={true}
            autoHideDuration={6000}
            onClose={props.onClose}
        >
            <Alert onClose={props.onClose} severity={props.severity} sx={{ width: "100%" }}>
                {props.message}
            </Alert>
        </Snackbar>
    );
}