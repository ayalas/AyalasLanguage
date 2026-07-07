import { useEffect, useState } from 'react';
import { type ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { JOB_FILTER, JOB_STATUS_MAPPING, JOB_TYPE_MAPPING, type IRowJob } from '../../types/grids/grids';
import GenericGrid from '../../components/GenericGrid';
import { AuthHeader } from '../../components/auth/AuthHeader';
import type { JobStatus, JobType } from '@ayalaslanguage/types/job';
import { useSearchParams } from 'react-router-dom';
import { JobGridFilter } from '../../components/gridfilters/JobGridFilter';

export default function JobGridPage() {
    const [searchParams] = useSearchParams();
    const [filterQS, setFilterQS] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [initialFilter, setInitialFilter] = useState<number | undefined>(undefined);
    
    const [colDefs] = useState<ColDef<IRowJob>[]>([
        { field: "jobId", flex: 1, headerName: 'Job Id' },
        { field: "jobType", flex: 3, headerName: 'Type',
            valueFormatter: params => JOB_TYPE_MAPPING[params.value as JobType],
        },
        { field: "jobStatus", flex: 2, headerName: 'Status',
            valueFormatter: params => JOB_STATUS_MAPPING[params.value as JobStatus],
        },
        { field: "completed", flex: 2, headerName: 'Completed' },
        { field: "errors", flex: 1, headerName: 'Errors' },
        { field: "leftToProcess", flex: 2, headerName: 'Not Processed' },
        { field: "mainRecordId", flex: 2, headerName: 'Record Id' },
        { field: "secondaryRecordId", flex: 2, headerName: 'Record Id2' },
        {
            field: "createdOn", headerName: 'Created On',
            valueFormatter: params => dayjs(params.value).format('YYYY-MM-DD HH:mm'),
            flex: 3, filter: true
        },
        {
            field: "modifiedOn", headerName: 'Modified On',
            valueFormatter: params => dayjs(params.value).format('YYYY-MM-DD HH:mm'),
            flex: 3, filter: true
        },
        {
            field: "firstError", headerName: 'Error', flex: 3, filter: true, editable: true, wrapText: true,
            cellClass: 'small-message-cell',
            cellEditor: 'agLargeTextCellEditor',
            cellEditorParams: {
                cols: 100,
                rows: 2
            },
            valueSetter: () => false,
        }
        /*,
        { field: "extraData", flex: 2, headerName: 'Extra Data' },*/
    ]);

    const onFilterChange = async (filter: number) => {
        if (filter == JOB_FILTER.ALL) {
            setFilterQS("");
        }
        else {
            setFilterQS(`filter=${filter}`);
        }
    };

    useEffect(() => {
        const filterFromQs = searchParams.get('filter');
        if (filterFromQs != undefined && filterFromQs != "") {
            setInitialFilter(Number(filterFromQs));
            setFilterQS(`filter=${filterFromQs}`);
        }
        setIsLoading(false);
    }, [searchParams]);

    return (
        <>
            <AuthHeader />
            <div className="form-row">
                <div className="form-input-cell">
                    <div className="content-line-part">Filter by Status:</div>
                    <div><JobGridFilter
                        data-testid="jobfilter"
                        value={initialFilter}
                        onChange={onFilterChange} /></div>
                </div>
            </div>
            {!isLoading && (
                <GenericGrid<IRowJob>
                    cols={colDefs}
                    endpoint="/admin/api/jobs/"
                    title="Job Runs"
                    rowHeight={70}
                    filterQS={filterQS} />
            )}
        </>
    );
}
