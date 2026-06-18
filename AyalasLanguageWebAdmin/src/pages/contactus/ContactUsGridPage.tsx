import { useEffect, useState } from 'react';
import { AllCommunityModule, type ColDef } from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import dayjs from 'dayjs';

import { AuthHeader } from '../../components/auth/AuthHeader';
import { errorHandler } from '../../utils/utils';
import axios from 'axios';
import { PAGE_SIZE } from '../../constants/admin';
import { CircleArrowLeft, CircleArrowRight } from 'lucide-react';
import type { IRowContactUs } from '../../types/grids/grids';


export default function ContactUsGridPage() {
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [hasMoreData, setHasMoreData] = useState(false);
    const modules = [AllCommunityModule];
    const [rowData, setRowData] = useState<IRowContactUs[]>([]);
    const [colDefs] = useState<ColDef<IRowContactUs>[]>([
        { field: "userId", flex: 1, headerName: 'User Id' },
        { field: "displayName", headerName: 'Display Name', flex: 2, filter: true },
        { field: "email", headerName: 'Email', flex: 2, filter: true },
        { field: "message", headerName: 'Message', flex: 6, filter: true,editable: true,wrapText:true,
            cellClass: 'contactus-message-cell', 
            cellEditor: 'agLargeTextCellEditor',
            cellEditorParams: {
                cols: 100, 
                rows: 18
            },
            valueSetter: () => false,
         },
        { field: "createdOn", headerName: 'Created On', 
            valueFormatter: params => dayjs(params.value).format('YYYY-MM-DD HH:mm'), 
            flex: 2, filter: true }
    ]);

    const loadData = async function (newPage: number) {
        try {
            setPage(newPage);
            const res = await axios.get<IRowContactUs[]>(`/admin/api/contactus/${newPage}`);
            setRowData(res.data.slice(0, PAGE_SIZE));
            setHasMoreData(res.data.length > PAGE_SIZE);
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData(0);
    }, []);
    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <div className="form-header">
                    <h1>Contact Us Messages</h1>
                </div>
                {error !== '' && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}
                
                <AgGridProvider modules={modules}>
                    <div style={{ height: 500 }}>
                        <AgGridReact
                            rowData={rowData}
                            columnDefs={colDefs}
                        />
                    </div>
                </AgGridProvider>
                <div className="form-row">
                    <div className="header-links">
                        <div className="form-button-cell">
                            <button data-testid="prev" type="button" disabled={page == 0} onClick={() => loadData(page - 1)} className="form-button" title="Previous page"><CircleArrowLeft /> Prev</button>
                        </div>
                        <div className="form-button-cell">
                            <button data-testid="next" type="button" disabled={!hasMoreData} onClick={() => loadData(page + 1)} className="form-button" title="Previous page">Next <CircleArrowRight /></button>
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
}
