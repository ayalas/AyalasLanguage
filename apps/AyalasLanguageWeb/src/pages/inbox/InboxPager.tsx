import { ChevronFirst, ChevronLast, CircleArrowLeft, CircleArrowRight } from "lucide-react";

interface Props {
  hasMoreData: boolean;
  page: number;
  loadData: (pgNum: number) => Promise<void>;
  totalPages: number;
}

export function InboxPager(props: Props) {
    const { hasMoreData, page, loadData, totalPages } = props;

    return (totalPages > 1 && (
        <div className="form-row">
            <div className="header-links">
                
                <div className="form-button-cell">
                    <button data-testid="first" type="button" disabled={page == 1} onClick={async () => await loadData(1)} className="pager-button" title="First page"><ChevronFirst /></button>
                </div>
                <div className="form-button-cell">
                    <button data-testid="prev" type="button" disabled={page == 1} onClick={async () => await loadData(page - 1)} className="pager-button" title="Previous page"><CircleArrowLeft /></button>
                </div>
                <div className="form-button-cell">
                    <label data-testid="pagenum">{page} of {totalPages}</label>
                </div>
                <div className="form-button-cell">
                    <button data-testid="next" type="button" disabled={!hasMoreData} onClick={async () => await loadData(page + 1)} className="pager-button" title="Previous page"><CircleArrowRight /></button>
                </div>
                <div className="form-button-cell">
                    <button data-testid="last" type="button" disabled={totalPages == 1} onClick={async () => await loadData(totalPages)} className="pager-button" title="Last page"><ChevronLast /></button>
                </div>
            </div>
        </div>)
    );
}