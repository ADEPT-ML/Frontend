import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {Paper, Radio} from "@mui/material";
import {Anomaly} from "../../App";
import * as css from "./styles.module.css";

type AnomalyTableProps = {
    anomalies: Anomaly[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

const headCells = [
    {
        id: "time",
        label: "Time"
    },
    {
        id: "type",
        label: "Type"
    }
];

function AnomalyTable(props: AnomalyTableProps) {
    const rows = props.anomalies.map((a, i) => (
        {
            id: i + 1,
            time: a.timestamp,
            type: a.type
        }
    ))

    const handleClick = (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>, id: number) => {
        if (isSelected(id)) {
            return;
        }

        props.onSelect(id);
    };

    const isSelected = (id: number) => id === props.selectedIndex;
    const dateOptions = {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: "2-digit", hour12: false
    } as const;

    function table() {
        return (
            <Paper sx={{width: "100%", height: "100%", position: "relative", overflow: "hidden"}} elevation={2}>
                <TableContainer className={css.slimScrollbar} sx={{position: "absolute", top: 0, bottom: 0}} >
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="none"></TableCell>
                                {headCells.map(headCell => (
                                    <TableCell
                                        key={headCell.id}
                                        align="center"
                                    >
                                        {headCell.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => {
                                const isItemSelected = isSelected(row.id);

                                return (
                                    <TableRow
                                        hover
                                        onClick={(event) => handleClick(event, row.id)}
                                        key={row.id}
                                        selected={isItemSelected}
                                    >
                                        <TableCell padding="checkbox">
                                            <Radio color="primary" checked={isItemSelected}/>
                                        </TableCell>
                                        <TableCell
                                            component="td"
                                            align="center"
                                        >
                                            {new Date(row.time).toLocaleString(undefined, dateOptions)}
                                        </TableCell>
                                        <TableCell align="center">{row.type}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        )
    }

    return (
        <div className={css.outerdiv}>
            <h2 className={css.heading}>Anomalies</h2>
            <div className={css.contentContainer}>
                {table()}
            </div>
        </div>
    );
}

export default React.memo(AnomalyTable)
