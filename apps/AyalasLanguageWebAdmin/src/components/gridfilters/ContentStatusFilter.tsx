import { useState } from "react";
import { CONTENT_STATUS_MAPPING } from "../../types/grids/grids";
import { CONTENT_STATUS } from "@ayalaslanguage/types/exercise";

type Props = {
    onChange: (contentStatus: number) => Promise<void>;
};

export function ContentStatusFilter(props: Props) {
    const {onChange} = props;
    const [contentStatus, setContentStatus] = useState(0);

    async function OnSelectChange(e: React.ChangeEvent<HTMLSelectElement>)
    {
        const tempValue = Number(e.target.value);
        setContentStatus(tempValue);
        await onChange(tempValue);
    }

    return (
        <select required data-testid="contentstatusfilter" className="filter-select" value={contentStatus} onChange={OnSelectChange}>
            <option value="-1">All statueses</option>
            <option value={CONTENT_STATUS.DRAFT}>{CONTENT_STATUS_MAPPING[CONTENT_STATUS.DRAFT]}</option>
            <option value={CONTENT_STATUS.APPROVED}>{CONTENT_STATUS_MAPPING[CONTENT_STATUS.APPROVED]}</option>
            <option value={CONTENT_STATUS.REMOVED}>{CONTENT_STATUS_MAPPING[CONTENT_STATUS.REMOVED]}</option>
        </select>
    );
}