import { useCallback, useRef, useState } from 'react';
import { type CellValueChangedEvent, type ColDef } from 'ag-grid-community';
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import { CONTENT_STATUS_MAPPING, type IRowExercise } from '../types/grids/grids';
import type { ContentStatus } from '@ayalaslanguage/types/exercise';
import dayjs from 'dayjs';
import GenericGrid from './GenericGrid';
import { ContentStatusFilter } from './gridfilters/ContentStatusFilter';
import { GridLinkCell } from './gridcells/GridLinkCell';
import type { AgGridReact } from 'ag-grid-react';

type Props = {
    learningPathId?: number;
};

export default function ExercisesGrid(props: Props) {
    const { learningPathId } = props;
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [filterQS, setFilterQS] = useState('');
    const [gridRefresh, setGridRefresh] = useState<number | null>(null);
    const gridRef = useRef<AgGridReact<IRowExercise>>(null);
    const [colDefs] = useState<ColDef<IRowExercise>[]>([
        { field: "email", headerName: 'Email', flex: 2, filter: true },
        { field: "knownLanguage", headerName: 'Known Language', flex: 1, filter: true },
        { field: "targetLanguage", headerName: 'Target Language', flex: 1, filter: true },
        {
            field: "name", headerName: 'Name',
            flex: 2, filter: true,
            cellRenderer: GridLinkCell<IRowExercise>,
            cellRendererParams: {
                getLinkCallback: (data: IRowExercise) => {
                    return learningPathId == data.learningPathId ? "#" : `/path/${data.learningPathId}`;
                },
                getTitleCallback: (data: IRowExercise) => {
                    return data.name;
                }
            }
        },
        {
            field: "data", headerName: 'Data', flex: 6, filter: true, editable: true, wrapText: true,
            cellClass: 'medium-message-cell',
            cellEditor: 'agLargeTextCellEditor',
            cellEditorParams: {
                cols: 100,
                rows: 8
            },
            valueSetter: () => false,
        },
        { field: "exerciseType", headerName: 'Type', flex: 2, filter: true },
        {
            field: "createdOn", headerName: 'Created On',
            valueFormatter: params => dayjs(params.value).format('YYYY-MM-DD HH:mm'),
            flex: 2, filter: true
        },
        {
            field: "status", flex: 2, filter: true, editable: true,

            headerName: 'Status',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                // Extracts [1, 2, 3] from the mapping object
                values: Object.keys(CONTENT_STATUS_MAPPING).map(Number),
            },
            // Maps 1 -> "Learner", 2 -> "Content Creator", etc.
            refData: CONTENT_STATUS_MAPPING,
            // Vital: ensures the grid saves the selection as a Number, not a string
            valueParser: (params) => Number(params.newValue) as ContentStatus,
        }
    ]);

    const handleApplyMultiStatusChange = async (contentStatus: number) => {
        if (contentStatus == -1) {
            setError('');
            return;
        }
        // Access the API via the ref
        const selectedNodes = gridRef.current?.api.getSelectedNodes();
        const selectedData = selectedNodes?.map(node => node.data?.exerciseId);

        if (selectedData && selectedData.length > 0) {
            try {
                await axios.post('/admin/api/multisetexercisestatus', { exerciseIds: selectedData, status: contentStatus })

                setError('');
                setSuccess(`Successfully updated selected exercises to status ${CONTENT_STATUS_MAPPING[contentStatus as ContentStatus]}`);
                setTimeout(() => {
                    setGridRefresh((gridRefresh ?? 0) + 1);  //refreshes grid on current page
                    setTimeout(() => {
                        setSuccess("");
                    }, 2000);
                }, 1000);
            }
            catch (err) {
                errorHandler(err, setError);
            }
        }
        else {
            setError(`No exercises were selected to change their status to ${CONTENT_STATUS_MAPPING[contentStatus as ContentStatus]}.`);
        }
    };

    const onContentStatusFilterChange = async (contentStatus: number) => {
        if (contentStatus == -1) {
            setFilterQS("");
        }
        else {
            setFilterQS(`status=${contentStatus}`);
        }
    };

    const handleStatusChange = async (event: CellValueChangedEvent<IRowExercise>) => {
        try {
            await axios.post('/admin/api/setexercisestatus', { exerciseId: event.data.exerciseId, status: Number(event.newRawValue) })
            setError("");
            setSuccess(`Successfully updated exercise ${event.data.exerciseId} to status ${CONTENT_STATUS_MAPPING[event.newValue as ContentStatus]}`);
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (err: unknown) {
            event.node.setDataValue(event.column, event.oldValue);
            errorHandler(err, setError);
        }
    };

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<IRowExercise>) => {
        if (event.source !== 'edit') { //prevent inifinte loops when reverting values by api
            return;
        }

        if (event.column.getColId() === 'status') {
            await handleStatusChange(event);
        }
    }, []);

    return (
        <>
            <div className="form-row">
                <div className="form-input-cell">
                    <div className="content-line-part">Filter by Status:</div>
                    <div><ContentStatusFilter data-testid="statusfilter" key="statusfilter" onChange={onContentStatusFilterChange} /></div>
                </div>
                <div className="form-input-cell">
                    <div className="content-line-part">Multi-change Status:</div>
                    <div><ContentStatusFilter data-testid="multistatuschange" key="multistatuschange" onChange={handleApplyMultiStatusChange} /></div>
                </div>
            </div>
            <GenericGrid<IRowExercise>
                cols={colDefs}
                endpoint={learningPathId != null ? `/admin/api/learning-path/${learningPathId}/exercises/` : "/admin/api/exercises/"}
                title="Exercises"
                onCellValueChanged={onCellValueChanged}
                successMessage={success}
                errorMessage={error}
                rowHeight={110}
                filterQS={filterQS}
                gridRef={gridRef}
                gridRefresh={gridRefresh} />
        </>
    );
}
