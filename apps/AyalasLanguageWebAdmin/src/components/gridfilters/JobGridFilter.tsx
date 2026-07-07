import { useEffect, useState } from "react";
import { JOB_FILTER, JOB_FILTER_MAPPING } from "../../types/grids/grids";

type Props = {
    onChange: (filter: number) => Promise<void>;
    value?: number
};

export function JobGridFilter(props: Props) {
    const { onChange, value } = props;
    const [filter, setFilter] = useState<number>(JOB_FILTER.ALL);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (value != null) {
            setFilter(value);
        }
        setIsLoading(false);
    }, [value])

    async function OnSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const tempValue = Number(e.target.value);
        setFilter(tempValue);
        await onChange(tempValue);
    }

    return (
        <>
        {!isLoading && (
        <select required data-testid="jobfilterselect" className="filter-select" value={filter} 
            onChange={OnSelectChange}>
            <option value={JOB_FILTER.ALL}>{JOB_FILTER_MAPPING[JOB_FILTER.ALL]}</option>
            <option value={JOB_FILTER.INCOMPLETE}>{JOB_FILTER_MAPPING[JOB_FILTER.INCOMPLETE]}</option>
            <option value={JOB_FILTER.FAILED}>{JOB_FILTER_MAPPING[JOB_FILTER.FAILED]}</option>
            <option value={JOB_FILTER.COMPLETED}>{JOB_FILTER_MAPPING[JOB_FILTER.COMPLETED]}</option>
        </select>
            )
        }
    </>);
}