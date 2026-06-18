import { useCallback, useState } from 'react';
import { type CellValueChangedEvent, type ColDef } from 'ag-grid-community';
import { errorHandler } from '../../../utils/utils';
import { type RoleType, ROLE_MAPPING, type IRowUser } from '../../../types/auth/auth';
import axios from 'axios';
import GenericGridPage from '../../../components/GenericGridPage';

export default function UsersPage() {
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [colDefs] = useState<ColDef<IRowUser>[]>([
        { field: "userId", flex: 1, headerName: 'User Id' },
        { field: "displayName", headerName: 'Display Name', flex: 2, filter: true },
        { field: "userName", headerName: 'Email', flex: 2, filter: true },
        {
            field: "role", flex: 1, filter: true, editable: true,

            headerName: 'Role',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                // Extracts [1, 2, 3] from the mapping object
                values: Object.keys(ROLE_MAPPING).map(Number),
            },
            // Maps 1 -> "Learner", 2 -> "Content Creator", etc.
            refData: ROLE_MAPPING,
            // Vital: ensures the grid saves the selection as a Number, not a string
            valueParser: (params) => Number(params.newValue) as RoleType,
        },
        { field: "emailConfirmed", headerName: 'Confirmed', flex: 1, filter: true },
        { field: "use2FALogin", headerName: 'Enabled 2FA', flex: 1, filter: true },
        { field: "knownLanguage", headerName: 'Known Language', flex: 1, filter: true },
        { field: "targetLanguage", headerName: 'Learning Language', flex: 1, filter: true }
    ]);

    const handleRoleChange = async (event: CellValueChangedEvent<IRowUser>) => {
        try {
            await axios.post("/admin/api/auth/setuserrole", { userId: event.data.userId, role: event.newValue })
            setError("");
            setSuccess(`Successfully updated user ${event.data.userName} to role ${ROLE_MAPPING[event.newValue as RoleType]}`);
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (err: unknown) {
            event.node.setDataValue(event.column, event.oldValue);
            errorHandler(err, setError);
        }
    };

    const onCellValueChanged = useCallback(async (event: CellValueChangedEvent<IRowUser>) => {
        if (event.source !== 'edit') { //prevent inifinte loops when reverting values by api
            return;
        }

        if (event.column.getColId() === 'role') {
            await handleRoleChange(event);
        }
    }, []);

    return (
        <GenericGridPage<IRowUser>
            cols={colDefs}
            endpoint="/admin/api/auth/users/"
            title="Users"
            onCellValueChanged={onCellValueChanged}
            successMessage={success}
            errorMessage={error} />
    );
}
