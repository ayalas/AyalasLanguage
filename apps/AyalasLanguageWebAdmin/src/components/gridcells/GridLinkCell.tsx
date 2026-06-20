import type { ICellRendererParams } from "ag-grid-community";
import { Link } from "react-router-dom";

interface GridLinkCellProps<T> {
  getLinkCallback: (data: T | undefined) => string;
  getTitleCallback: (data: T | undefined) => string;
}

export function GridLinkCell<T>(props: ICellRendererParams<T> & GridLinkCellProps<T>) {
    const { data, getLinkCallback, getTitleCallback } = props;

    return (
        <Link to={getLinkCallback(data)} className="link-button">{getTitleCallback(data)}</Link>
    );
}