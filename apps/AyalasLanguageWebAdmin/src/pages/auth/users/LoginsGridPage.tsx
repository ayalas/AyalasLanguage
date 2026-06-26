import { useState } from 'react';
import { type ColDef } from 'ag-grid-community';
import { APP_ID_MAPPING, type IRowLogin } from '../../../types/auth/auth';
import { AuthHeader } from '../../../components/auth/AuthHeader';
import GenericGrid from '../../../components/GenericGrid';
import dayjs from 'dayjs';
import type { AppIdentifier } from '@ayalaslanguage/types/auth';

export default function LoginsGridPage() {
    const [colDefs] = useState<ColDef<IRowLogin>[]>([
        { field: "userId", flex: 1, headerName: 'User Id' },
        { field: "email", headerName: 'Email', flex: 2, filter: true },
        { field: "appId", headerName: 'App', 
            valueFormatter: params => APP_ID_MAPPING[params.value as AppIdentifier],
            flex: 2, filter: true
         },
        {
            field: "createdOn", headerName: 'Created On',
            valueFormatter: params => dayjs(params.value).format('YYYY-MM-DD HH:mm'),
            flex: 2, filter: true
        },
        {
            field: "expiresOn", headerName: 'Expires On',
            valueFormatter: params => dayjs(params.value).format('YYYY-MM-DD HH:mm'),
            flex: 2, filter: true
        }
    ]);

    return (
        <>
            <AuthHeader />
            <GenericGrid<IRowLogin>
                cols={colDefs}
                endpoint="/admin/api/auth/logins/"
                title="Logins"
            />
        </>
    );
}
