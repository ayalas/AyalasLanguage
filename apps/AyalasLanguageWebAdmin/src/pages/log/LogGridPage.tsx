import { useState } from 'react';
import { type ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { LOG_TYPE_MAPPING, type IRowLog } from '../../types/grids/grids';
import type { LogType } from '@ayalaslanguage/types/log';
import GenericGrid from '../../components/GenericGrid';
import { AuthHeader } from '../../components/auth/AuthHeader';

export default function LogGridPage() {
    const [colDefs] = useState<ColDef<IRowLog>[]>([
        { field: "logId", flex: 1, headerName: 'Log Id' },
        { field: "userId", flex: 1, headerName: 'User Id' },
        { field: "email", headerName: 'Email', flex: 2, filter: true },
        {
            field: "logType", headerName: 'Log Type',
            valueFormatter: params => LOG_TYPE_MAPPING[params.value as LogType],
            flex: 2, filter: true
        },
        {
            field: "description", headerName: 'Description', flex: 6, filter: true, editable: true, wrapText: true,
            cellClass: 'long-message-cell',
            cellEditor: 'agLargeTextCellEditor',
            cellEditorParams: {
                cols: 100,
                rows: 18
            },
            valueSetter: () => false,
        },
        {
            field: "createdOn", headerName: 'Created On',
            valueFormatter: params => dayjs(params.value).format('YYYY-MM-DD HH:mm'),
            flex: 2, filter: true
        }
    ]);

    return (
        <>
            <AuthHeader />
            <GenericGrid<IRowLog>
                cols={colDefs}
                endpoint="/admin/api/logs/"
                title="Log Messages"
                rowHeight={200} />
        </>
    );
}
