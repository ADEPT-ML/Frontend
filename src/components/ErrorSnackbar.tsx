import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, {AlertProps} from '@mui/material/Alert';
import {SnackDetails} from "../App";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

type SnackbarProps = {
    snackDetails: SnackDetails;
    onClose: () => void;
}

export default function ErrorSnackbar(props: SnackbarProps) {
    return (
        <Snackbar
            anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            open={true}
            autoHideDuration={6000}
            onClose={props.onClose}
        >
            <Alert onClose={props.onClose} severity={props.snackDetails.severity} sx={{width: '100%'}}>
                {props.snackDetails.message}
            </Alert>
        </Snackbar>
    );
}