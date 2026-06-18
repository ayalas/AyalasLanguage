import { useEffect, useState } from 'react';
import { AllCommunityModule, type ColDef } from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { AuthHeader } from './auth/AuthHeader';
import { errorHandler } from '../utils/utils';
import axios from 'axios';
import { PAGE_SIZE } from '../constants/admin';
import type { AdminGridResponse } from '../types/grids/grids';
import { GridPager } from './GridPager';

interface GenericGridPageProps<T> {
  cols: ColDef<T>[];
  endpoint: string;
  title: string;
  rowHeight: number;
}

export default function GenericGridPage<T>(props: GenericGridPageProps<T>) {
    const {cols, endpoint, title, rowHeight} = props;
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMoreData, setHasMoreData] = useState(false);
    const modules = [AllCommunityModule];
    const [rowData, setRowData] = useState<T[]>([]);
    const [colDefs] = useState<ColDef<T>[]>(cols);

    const loadData = async function (newPage: number) {
        try {
            setPage(newPage);
            const res = await axios.get<AdminGridResponse<T>>(`${endpoint}${newPage - 1}`);
            const resObj = res.data;

            if (resObj.numOfRecords > 0) {
                let numOfPages = resObj.numOfRecords / PAGE_SIZE;
                if (resObj.numOfRecords % PAGE_SIZE > 0)
                    numOfPages++;
                setTotalPages(numOfPages);
            }
            setRowData(resObj.data.slice(0, PAGE_SIZE));
            setHasMoreData(resObj.data.length > PAGE_SIZE);
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData(1);
    }, []);
    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <div className="form-header">
                    <h1>{title}</h1>
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
                            rowHeight={rowHeight}
                        />
                    </div>
                </AgGridProvider>
                <GridPager hasMoreData={hasMoreData} page={page} totalPages={totalPages} loadData={loadData} />
            </div >
        </>
    );
}
