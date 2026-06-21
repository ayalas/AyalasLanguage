import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
    AllCommunityModule, type CellValueChangedEvent, type ColDef, type RowSelectionOptions
} from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import { PAGE_SIZE } from '../constants';
import type { AdminGridResponse } from '../types/grids/grids';
import { GridPager } from './GridPager';

interface GenericGridPageProps<T> {
    cols: ColDef<T>[];
    endpoint: string;
    title?: string;
    rowHeight?: number;
    onCellValueChanged?: (event: CellValueChangedEvent<T>) => Promise<void>;
    successMessage?: string;
    errorMessage?: string;
    filterQS?: string;
    gridRef?: RefObject<AgGridReact<T> | null>;
    gridRefresh?: number | null;
}

export default function GenericGridPage<T>(props: GenericGridPageProps<T>) {
    const { cols, endpoint, title, rowHeight, onCellValueChanged, successMessage, errorMessage, filterQS, gridRef, gridRefresh } = props;
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [rowHeightInternal, setRowHeightInternal] = useState(42);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMoreData, setHasMoreData] = useState(false);
    const modules = [AllCommunityModule];
    const [rowData, setRowData] = useState<T[]>([]);
    const [colDefs] = useState<ColDef<T>[]>(cols);
    const rowSelection = useMemo<RowSelectionOptions>(() => {
        return {
            mode: 'multiRow',        // Enables multiple row selection
            headerCheckbox: true,    // Adds 'Select All' checkbox to header
            checkboxes: true,        // Adds checkboxes to every row
            enableClickSelection: true // (Optional) allows clicking the row to select
        };
    }, []);
    const rowSelectionDefault = useMemo<RowSelectionOptions>(() => {
        return {
            mode: 'singleRow',        
            headerCheckbox: false, 
            checkboxes: false, 
            enableClickSelection: false
        };
    }, []);

    const loadData = async function (newPage: number) {
        try {
            setPage(newPage);

            let endpointUrl = `${endpoint}${newPage - 1}`;
            if (filterQS != null && filterQS != "") {
                endpointUrl = `${endpointUrl}?${filterQS}`;
            }

            const res = await axios.get<AdminGridResponse<T>>(endpointUrl);
            const resObj = res.data;

            if (resObj.numOfRecords > 0) {
                let numOfPages = Math.trunc(resObj.numOfRecords / PAGE_SIZE);
                if (resObj.numOfRecords % PAGE_SIZE > 0)
                    numOfPages++;
                setTotalPages(numOfPages);
            }
            setRowData(resObj.data.slice(0, PAGE_SIZE));
            setHasMoreData(resObj.data.length > PAGE_SIZE);
            setError("");
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    useEffect(() => {
        if (rowHeight != undefined)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRowHeightInternal(rowHeight);
    }, [rowHeight]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData(1);
    }, [filterQS]);

    //reloads current page
    useEffect(() => {
        if (gridRefresh != null) {
            loadData(page);
        }
    }, [gridRefresh])

    return (
        <>
            <div className="form-container">
                {title !== '' && (
                    <div className="form-header">
                        <h1>{title}</h1>
                    </div>
                )}
                {successMessage !== '' && (
                    <div className="form-row">
                        <h3>{successMessage}</h3>
                    </div>
                )}
                {errorMessage !== '' && (
                    <div className="form-row">
                        <label className="form-error">{errorMessage}</label>
                    </div>
                )}
                {error !== '' && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}

                <AgGridProvider modules={modules}>
                    <div style={{ height: 500 }}>
                        <AgGridReact
                            rowData={rowData}
                            columnDefs={colDefs}
                            rowHeight={rowHeightInternal}
                            onCellValueChanged={onCellValueChanged}
                            ref={gridRef}
                            rowSelection={gridRef != null? rowSelection : rowSelectionDefault}
                        />
                    </div>
                </AgGridProvider>
                <GridPager hasMoreData={hasMoreData} page={page} totalPages={totalPages} loadData={loadData} />
            </div >
        </>
    );
}
