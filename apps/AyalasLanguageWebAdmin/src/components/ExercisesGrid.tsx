import { useCallback, useState } from 'react';
import { type CellValueChangedEvent, type ColDef } from 'ag-grid-community';
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import { CONTENT_STATUS_MAPPING, type IRowExercise } from '../types/grids/grids';
import type { ContentStatus } from '@ayalaslanguage/types/exercise';
import dayjs from 'dayjs';
import GenericGrid from './GenericGrid';
import { ContentStatusFilter } from './gridfilters/ContentStatusFilter';
import { GridLinkCell } from './gridcells/GridLinkCell';

type Props = {
    learningPathId?: number;
};

export default function ExercisesGrid(props: Props) {
    const {learningPathId} = props;
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [filterQS, setFilterQS] = useState('');
    const [colDefs] = useState<ColDef<IRowExercise>[]>([
        { field: "email", headerName: 'Email', flex: 2, filter: true },
        { field: "knownLanguage", headerName: 'Known Language', flex: 1, filter: true },
        { field: "targetLanguage", headerName: 'Target Language', flex: 1, filter: true },
        { field: "name", headerName: 'Name', 
            flex: 2, filter: true,
            cellRenderer: GridLinkCell<IRowExercise>,
            cellRendererParams: {
                getLinkCallback: (data: IRowExercise) => {
                    return learningPathId == data.learningPathId? "#": `/admin/path/${data.learningPathId}`;
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
            field: "status", flex: 1, filter: true, editable: true,

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
            axios.post('/admin/api/setexercisestatus', { exerciseId: event.data.exerciseId, status: Number(event.newRawValue) })
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
                <div className="form-content-row">Filter by Status:</div>
                <div><ContentStatusFilter onChange={onContentStatusFilterChange} /></div>
            </div>
            <GenericGrid<IRowExercise>
                cols={colDefs}
                endpoint={ learningPathId != null? `/admin/api/learning-path/${learningPathId}/exercises/` : "/admin/api/exercises/"}
                title="Exercises"
                onCellValueChanged={onCellValueChanged}
                successMessage={success}
                errorMessage={error}
                rowHeight={110}
                filterQS={filterQS} />
        </>
    );
}
