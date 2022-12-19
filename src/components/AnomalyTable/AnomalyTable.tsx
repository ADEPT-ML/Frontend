import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
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
    const [page, setPage] = React.useState(0);
    const rowsPerPage = 5;
    const scrollLimit = 20;
    let rows = props.anomalies.map((a, i) => (
        {
            id: i + 1,
            time: a.timestamp,
            type: a.type
        }
    ))

    const paginationEnabled = rows.length > scrollLimit;

    if(paginationEnabled) {
        for (let i = 0; i < rows.length % rowsPerPage; i++) {
            rows.push({id: -1, time: "", type: ""});
        }
    }

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
            <Paper className={`${css.tablePaper} ${paginationEnabled ? "" : css.scrollPaper}`} elevation={2}>
                <TableContainer className={css.slimScrollbar} sx={{maxHeight: "100%"}}>
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
                            {(paginationEnabled
                                    ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : rows
                            ).map((row) => {
                                const isItemSelected = isSelected(row.id);

                                return (row.id === -1 ?
                                        <TableRow sx={{visibility: "hidden"}}>
                                            <TableCell align="center">-</TableCell>
                                        </TableRow>
                                        :
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
                        {!paginationEnabled ?
                            null :
                            <TableFooter>
                                <TableRow>
                                    <TablePagination
                                        sx={{borderBottom: "None"}}
                                        rowsPerPageOptions={[]}
                                        colSpan={3}
                                        count={rows.length}
                                        rowsPerPage={rowsPerPage}
                                        page={Math.min(page, Math.floor(rows.length / rowsPerPage))}
                                        onPageChange={(event, page) => setPage(page)}
                                        labelDisplayedRows={() => {
                                            return `${page + 1} / ${Math.floor(rows.length / rowsPerPage)}`;
                                        }
                                        }
                                    />
                                </TableRow>
                            </TableFooter>}
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
