import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import axios from "axios";

import { errorHandler } from "@ayalaslanguage/types/error";
import type { InboxUserMessage, PagedResponse } from "@ayalaslanguage/types/sharedfrontlib/inbox";
import type { User } from "@ayalaslanguage/types/sharedfrontlib/user";

import { PAGE_SIZE } from "../../constants/learning";
import { GridPager } from "../GridPager";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
    showOnNoData: boolean;
    learningPathId?: number;
    inResponseToMessageId?: number;
    title?: string;
}

export function InboxMessagesComponent({ showOnNoData, learningPathId, inResponseToMessageId, title }: Props) {
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMoreData, setHasMoreData] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [rowData, setRowData] = useState<InboxUserMessage[]>([]);
    const { user } = useOutletContext<{ user: User | null }>();

    const loadData = async function (newPage: number) {
        try {
            setPage(newPage);

            let endpointUrl = `/api/inbox/${newPage - 1}`;
            if (inResponseToMessageId != null) {
                endpointUrl = endpointUrl + `?inResponseToMessageId=${inResponseToMessageId}`;
            }
            else if (learningPathId != null) {
                endpointUrl = endpointUrl + `?learningPathId=${learningPathId}`;
            }

            const res = await axios.get<PagedResponse<InboxUserMessage>>(endpointUrl);
            const resObj = res.data;

            if (resObj.numOfRecords > 0) {
                setHasData(true);
                let numOfPages = Math.trunc(resObj.numOfRecords / PAGE_SIZE);
                if (resObj.numOfRecords % PAGE_SIZE > 0)
                    numOfPages++;
                setTotalPages(numOfPages);
            }
            else {
                setHasData(false);
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
    }, [inResponseToMessageId, learningPathId]);

    return (
        <>
            {!hasData && !showOnNoData && (
                <></>
            ) || (
                    <>
                        {title != null && (
                            <div className="inform-header">
                                <h2>{title}</h2>
                            </div>
                        )}
                        {error !== "" && (
                            <div className="form-row">
                                <label className="form-error">{error}</label>
                            </div>
                        )}

                        {
                            !hasData && (
                                <div className="form-row">
                                    <div className="form-label-cell">
                                        <label className="form-label">No messages.</label>
                                    </div>
                                </div>
                            ) || (
                                <div className="inbox-grid">
                                    <div className="grid-row">
                                        <div className="grid-cell">From</div>
                                        <div className="grid-cell">To</div>
                                        <div className="grid-cell grid-cell-long">Message</div>
                                        <div className="grid-cell grid-cell-med grid-cell-end">Sent</div>
                                    </div>
                                    {rowData.map((msg, index) => {
                                        return (
                                            <div key={msg.userMessageId} className={`grid-row${index == rowData.length - 1 ? " grid-row-end" : ""}`}>
                                                <div className={`grid-cell${msg.read ? "" : " grid-unread"}`}>{msg.fromUserId == user?.userId ? "Me" : msg.fromUserName}</div>
                                                <div className={`grid-cell${msg.read ? "" : " grid-unread"}`}>{msg.toUserId == user?.userId ? "Me" : msg.contactName}</div>
                                                <div className={`grid-cell grid-cell-long${msg.read ? "" : " grid-unread"}`}><Link to={`/inbox/${msg.userMessageId}`}>{msg.message.substring(0, 100)}</Link></div>
                                                <div className={`grid-cell grid-cell-med grid-cell-end${msg.read ? "" : " grid-unread"}`}>{
                                                    dayjs.utc(msg.sendDate).local().format(
                                                        dayjs.utc(msg.sendDate).local().isSame(dayjs(), 'year') ? 'MMM DD HH:mm' : 'MMM DD, YYYY HH:mm'
                                                    )
                                                }</div>
                                            </div>
                                        )
                                    })}

                                    <GridPager hasMoreData={hasMoreData} page={page} totalPages={totalPages} loadData={loadData} />
                                </div>
                            )
                        }
                    </>
                )}
        </>
    );
}