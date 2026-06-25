import { useCallback, useEffect, useRef, useState } from 'react';

import { type CellValueChangedEvent, type ColDef } from 'ag-grid-community';
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import { CONTENT_STATUS_MAPPING, type IRowLearningPath } from '../../types/grids/grids';
import type { ContentStatus } from '@ayalaslanguage/types/exercise';
import dayjs from 'dayjs';
import GenericGrid from '../../components/GenericGrid';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { ContentStatusFilter } from '../../components/gridfilters/ContentStatusFilter';
import { GridLinkCell } from '../../components/gridcells/GridLinkCell';
import type { AgGridReact } from 'ag-grid-react';
import { useSearchParams } from 'react-router-dom';

export default function LearningPathsGridPage() {
    const [success, setSuccess] = useState('');

    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const [filterQS, setFilterQS] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [gridRefresh, setGridRefresh] = useState<number | null>(null);
    const gridRef = useRef<AgGridReact<IRowLearningPath>>(null);
    const [initialStatusFilter, setInitialStatusFilter] = useState<number | undefined>(undefined);
    const [colDefs] = useState<ColDef<IRowLearningPath>[]>([
        { field: "email", headerName: 'Email', flex: 2, filter: true },
        { field: "knownLanguage", headerName: 'Known Language', flex: 1, filter: true },
        { field: "targetLanguage", headerName: 'Target Language', flex: 1, filter: true },
        { field: "level", headerName: 'Level', flex: 1, filter: true },
        { field: "chapter", headerName: 'Chapter', flex: 1, filter: true },
        {
            field: "name", headerName: 'Name', flex: 2, filter: true,
            cellRenderer: GridLinkCell<IRowLearningPath>,
            cellRendererParams: {
                getLinkCallback: (data: IRowLearningPath) => {
                    return `/path/${data.learningPathId}`;
                },
                getTitleCallback: (data: IRowLearningPath) => {
                    return data.name;
                }
            }
        },
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

    useEffect(() => {
        const statusFromQs = searchParams.get('status');
        if (statusFromQs != undefined && statusFromQs != "") {
            console.log("setting statusFromQs", statusFromQs);
            setInitialStatusFilter(Number(statusFromQs));
            setFilterQS(`status=${statusFromQs}`);
        }
        setIsLoading(false);
    }, [searchParams]);

    const handleApplyMultiStatusChange = async (contentStatus: number) => {
        if (contentStatus == -1) {
            setError('');
            return;
        }
        // Access the API via the ref
        const selectedNodes = gridRef.current?.api.getSelectedNodes();
        const selectedData = selectedNodes?.map(node => node.data?.learningPathId);

        if (selectedData && selectedData.length > 0) {
            try {
                await axios.post('/admin/api/multisetpathstatus', { learningPathIds: selectedData, status: contentStatus })

                setError('');
                setSuccess(`Successfully updated selected lessons to status ${CONTENT_STATUS_MAPPING[contentStatus as ContentStatus]}`);
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
            setError(`No lessons were selected to change their status to ${CONTENT_STATUS_MAPPING[contentStatus as ContentStatus]}.`);
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

    const handleStatusChange = async (event: CellValueChangedEvent<IRowLearningPath>) => {
        try {
            await axios.post('/admin/api/setpathstatus', { learningPathId: event.data.learningPathId, status: Number(event.newRawValue) })
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
                <div className="form-input-cell">
                    <div className="content-line-part">Filter by Status:</div>
                    <div><ContentStatusFilter
                        data-testid="statusfilter"
                        key="statusfilter"
                        value={initialStatusFilter}
                        onChange={onContentStatusFilterChange} /></div>
                </div>
                <div className="form-input-cell">
                    <div className="content-line-part">Multi-change Status:</div>
                    <div><ContentStatusFilter
                        data-testid="multistatuschange"
                        key="multistatuschange"
                        onChange={handleApplyMultiStatusChange} /></div>
                </div>
            </div>
            {!isLoading && (
                <GenericGrid<IRowLearningPath>
                    cols={colDefs}
                    endpoint="/admin/api/learning-paths/"
                    onCellValueChanged={onCellValueChanged}
                    successMessage={success}
                    errorMessage={error}
                    filterQS={filterQS}
                    gridRef={gridRef}
                    gridRefresh={gridRefresh} />
            )}

        </>
    );
}
