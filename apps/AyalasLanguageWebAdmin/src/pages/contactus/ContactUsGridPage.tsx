import { useState } from 'react';
import { type ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import type { IRowContactUs } from '../../types/grids/grids';
import GenericGridPage from '../../components/GenericGridPage';

export default function ContactUsGridPage() {
    const [colDefs] = useState<ColDef<IRowContactUs>[]>([
        { field: "userId", flex: 1, headerName: 'User Id' },
        { field: "displayName", headerName: 'Display Name', flex: 2, filter: true },
        { field: "email", headerName: 'Email', flex: 2, filter: true },
        {
            field: "message", headerName: 'Message', flex: 6, filter: true, editable: true, wrapText: true,
            cellClass: 'contactus-message-cell',
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
        <GenericGridPage<IRowContactUs>
            cols={colDefs}
            endpoint="/admin/api/contactus/"
            title="Contact Us Messages"
            rowHeight={200} />
    );
}
