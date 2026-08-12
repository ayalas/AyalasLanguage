import { useEffect, useState } from "react";
import { FormHeader } from "../../components/FormHeader";
import { InboxPager } from "./InboxPager";
import { errorHandler } from "@ayalaslanguage/types/error";
import type { InboxUserMessage, PagedResponse } from "@ayalaslanguage/types/sharedfrontlib/inbox";
import axios from "axios";
import { PAGE_SIZE } from "../../constants/learning";
import type { User } from "@ayalaslanguage/types/sharedfrontlib/user";
import { Link, useOutletContext } from "react-router-dom";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function InboxPage() {
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMoreData, setHasMoreData] = useState(false);
    const [rowData, setRowData] = useState<InboxUserMessage[]>([]);
    const { user } = useOutletContext<{ user: User | null }>();

    const loadData = async function (newPage: number) {
        try {
            setPage(newPage);

            let endpointUrl = `/api/inbox/${newPage - 1}`;

            const res = await axios.get<PagedResponse<InboxUserMessage>>(endpointUrl);
            const resObj = res.data;

            if (resObj.numOfRecords > 0) {
                let numOfPages = Math.trunc(resObj.numOfRecords / PAGE_SIZE);
                if (resObj.numOfRecords % PAGE_SIZE > 0)
                    numOfPages++;
                setTotalPages(numOfPages);
            }
            setRowData(resObj.data.slice(0, PAGE_SIZE));
            setHasMoreData(resObj.data.length > PAGE_SIZE);
            setError("");
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    useEffect(() => {
        loadData(1);
    }, []);

    return (
        <div className="form-container">
            <FormHeader isPublic={false} title="Inbox" />
            {error !== "" && (
                <div className="form-row">
                    <label className="form-error">{error}</label>
                </div>
            )}

            {rowData.length == 0 && (
                <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">No messages.</label>
                        </div>
                    </div>
            ) || (
                    <>
                        <div className="grid-row">
                            <div className="grid-cell">From</div>
                            <div className="grid-cell">To</div>
                            <div className="grid-cell grid-cell-long">Message</div>
                            <div className="grid-cell grid-cell-long grid-cell-end">Sent</div>
                        </div>
                        {rowData.map((msg, index) => {
                            return (
                                <div key={msg.userMessageId} className={`grid-row${index == rowData.length - 1 ? " grid-row-end" : ""}`}>
                                    <div className="grid-cell">{msg.fromUserId == user?.userId ? "Me" : msg.fromUserName}</div>
                                    <div className="grid-cell">{msg.toUserId == user?.userId ? "Me" : msg.contactName}</div>
                                    <div className="grid-cell grid-cell-long"><Link to={`/inbox/${msg.userMessageId}`}>{msg.message.substring(0, 100)}...</Link></div>
                                    <div className="grid-cell grid-cell-long grid-cell-end">{dayjs.utc(msg.sendDate).local().format('MMM DD, YYYY HH:mm')}</div>
                                </div>
                            )
                        })}

                        <InboxPager hasMoreData={hasMoreData} page={page} totalPages={totalPages} loadData={loadData} />
                    </>
                )}
        </div>
    );
}