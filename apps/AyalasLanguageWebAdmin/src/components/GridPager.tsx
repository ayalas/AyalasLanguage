import { ChevronFirst, ChevronLast, CircleArrowLeft, CircleArrowRight } from "lucide-react";

interface Props {
  hasMoreData: boolean;
  page: number;
  loadData: (pgNum: number) => Promise<void>;
  totalPages: number;
}

export function GridPager(props: Props) {
    const { hasMoreData, page, loadData, totalPages } = props;

    return (
        <div className="form-row">
            <div className="header-links">
                
                <div className="form-button-cell">
                    <button data-testid="first" type="button" disabled={page == 1} onClick={async () => await loadData(1)} className="form-button" title="First page"><ChevronFirst /></button>
                </div>
                <div className="form-button-cell">
                    <button data-testid="prev" type="button" disabled={page == 1} onClick={async () => await loadData(page - 1)} className="form-button" title="Previous page"><CircleArrowLeft /> Prev</button>
                </div>
                <div className="form-button-cell">
                    <input data-testid="pagenum" className="page-number" step="1" type="number" min="1" max={totalPages} readOnly={totalPages == 1} value={page} onChange={async(e) => { await loadData(Number(e.target.value)) }} />&nbsp;of&nbsp;{totalPages}
                </div>
                <div className="form-button-cell">
                    <button data-testid="next" type="button" disabled={!hasMoreData} onClick={async () => await loadData(page + 1)} className="form-button" title="Previous page">Next <CircleArrowRight /></button>
                </div>
                <div className="form-button-cell">
                    <button data-testid="last" type="button" disabled={totalPages == 1} onClick={async () => await loadData(totalPages)} className="form-button" title="Last page"><ChevronLast /></button>
                </div>
            </div>
        </div>
    );
}