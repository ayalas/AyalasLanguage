import { useCallback, useState } from 'react';
import { type CellValueChangedEvent, type ColDef } from 'ag-grid-community';
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import GenericGridPage from '../../components/GenericGridPage';
import type { RoleType } from '@ayalaslanguage/types/auth';
import { CONTENT_STATUS_MAPPING, type IRowLearningPath } from '../../types/grids/grids';
import type { ContentStatus } from '@ayalaslanguage/types/exercise';
import dayjs from 'dayjs';

export default function LearningPathsGridPage() {
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [colDefs] = useState<ColDef<IRowLearningPath>[]>([
        { field: "userId", flex: 1, headerName: 'User Id' },
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
            valueParser: (params) => Number(params.newValue) as RoleType,
        },
        { field: "countExercises", headerName: 'Exercises', flex: 1, filter: true }
    ]);

    const handleStatusChange = async (event: CellValueChangedEvent<IRowLearningPath>) => {
        try {
            axios.post('/admin/api/setpathstatus', {learningPathId: event.data.learningPathId, status: Number(event.newRawValue)} )
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
        <GenericGridPage<IRowLearningPath>
            cols={colDefs}
            endpoint="/admin/api/learning-paths/"
            title="Lessons"
            onCellValueChanged={onCellValueChanged}
            successMessage={success}
            errorMessage={error} />
    );
}
