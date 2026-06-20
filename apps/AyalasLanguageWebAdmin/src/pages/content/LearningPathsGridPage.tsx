import { useCallback, useState } from 'react';
import { type CellValueChangedEvent, type ColDef } from 'ag-grid-community';
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import { CONTENT_STATUS_MAPPING, type IRowLearningPath } from '../../types/grids/grids';
import type { ContentStatus } from '@ayalaslanguage/types/exercise';
import dayjs from 'dayjs';
import GenericGrid from '../../components/GenericGrid';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { ContentStatusFilter } from '../../components/gridfilters/ContentStatusFilter';

export default function LearningPathsGridPage() {
    const [success, setSuccess] = useState('');
    const [filterQS, setFilterQS] = useState('');
    const [error, setError] = useState('');
    const [colDefs] = useState<ColDef<IRowLearningPath>[]>([
        { field: "email", headerName: 'Email', flex: 2, filter: true },
        { field: "knownLanguage", headerName: 'Known Language', flex: 1, filter: true },
        { field: "targetLanguage", headerName: 'Target Language', flex: 1, filter: true },
        { field: "level", headerName: 'Level', flex: 1, filter: true },
        { field: "chapter", headerName: 'Chapter', flex: 1, filter: true },
        { field: "name", headerName: 'Name', flex: 2, filter: true },
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
        },
        { field: "countExercises", headerName: 'Exercises', flex: 1, filter: true }
    ]);

    const onContentStatusFilterChange = async (contentStatus: number) => {
        if (contentStatus == -1) {
            setFilterQS("");
        }
        else {
            setFilterQS(`status=${contentStatus}`);
        }
    };

    const handleStatusChange = async (event: CellValueChangedEvent<IRowLearningPath>) => {
        try {
            axios.post('/admin/api/setpathstatus', { learningPathId: event.data.learningPathId, status: Number(event.newRawValue) })
            setError("");
            setSuccess(`Successfully updated lesson ${event.data.name} to status ${CONTENT_STATUS_MAPPING[event.newValue as ContentStatus]}`);
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (err: unknown) {
            event.node.setDataValue(event.column, event.oldValue);
            errorHandler(err, setError);
        }
    };

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<IRowLearningPath>) => {
        if (event.source !== 'edit') { //prevent inifinte loops when reverting values by api
            return;
        }

        if (event.column.getColId() === 'status') {
            await handleStatusChange(event);
        }
    }, []);

    return (
        <>
            <AuthHeader />
            <div className="form-row">
                <div className="form-content-row">Filter by Status:</div>
                <div><ContentStatusFilter onChange={onContentStatusFilterChange} /></div>
            </div>
            <GenericGrid<IRowLearningPath>
                cols={colDefs}
                endpoint="/admin/api/learning-paths/"
                onCellValueChanged={onCellValueChanged}
                successMessage={success}
                errorMessage={error}
                filterQS={filterQS} />
        </>
    );
}
