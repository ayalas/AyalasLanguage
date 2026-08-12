import { View, Text, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { FormHeader } from "@/components/FormHeader";
import { InboxPager } from "@/components/inbox/InboxPager";
import { errorHandler } from "@ayalaslanguage/types/error";
import type { InboxUserMessage, PagedResponse } from "@ayalaslanguage/types/sharedfrontlib/inbox";
import api from "@/lib/api";
import { COLOR_PLAY, PAGE_SIZE, PRIMARY_DARK, PRIMARY_LIGHT } from "@/constants";
import { Link } from "expo-router";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuth } from "@/lib/AuthContext";

import useTextStyles from "@/lib/useTextStyles";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function InboxPage() {
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [records, setRecords] = useState(0);
    const [hasMoreData, setHasMoreData] = useState(false);
    const [rowData, setRowData] = useState<InboxUserMessage[]>([]);
    const { user } = useAuth();
    const { styles, isDark } = useTextStyles();

    const colorPrimary = isDark? PRIMARY_DARK : PRIMARY_LIGHT;

    const loadData = async function (newPage: number) {
        try {
            setPage(newPage);

            let endpointUrl = `/api/inbox/${newPage - 1}`;

            const res = await api.get<PagedResponse<InboxUserMessage>>(endpointUrl);
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
        <View className="root">
            <ScrollView className='form-container' showsVerticalScrollIndicator={false}>
                <View className="form-container">
                    <FormHeader title="Inbox" />
                    {error !== '' && (
                        <View className="form-row">
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {rowData.length == 0 && (
                        <View className="form-row">
                            <View className="form-label-cell">
                                <Text style={styles.label}>No messages.</Text>
                            </View>
                        </View>
                    ) || (
                            <View className="inbox-grid">
                                <View className="grid-row">
                                    <View className="grid-cell"><Text style={styles.text}>From</Text></View>
                                    <View className="grid-cell"><Text style={styles.text}>To</Text></View>
                                    <View className="grid-cell grid-cell-long"><Text style={styles.text}>Message</Text></View>
                                    <View className="grid-cell grid-cell-long grid-cell-end"><Text style={styles.text}>Sent</Text></View>
                                </View>
                                {rowData.map((msg, index) => {
                                    return (
                                        <View key={msg.userMessageId} className={`grid-row${index == rowData.length - 1 ? " grid-row-end" : ""}`}>
                                            <View className="grid-cell"><Text numberOfLines={1} style={[styles.text, {color: msg.read? colorPrimary : COLOR_PLAY}]}>{msg.fromUserId == user?.userId ? "Me" : msg.fromUserName}</Text></View>
                                            <View className="grid-cell"><Text numberOfLines={1} style={[styles.text, {color: msg.read? colorPrimary : COLOR_PLAY}]}>{msg.toUserId == user?.userId ? "Me" : msg.contactName}</Text></View>
                                            <View className="grid-cell grid-cell-long"><Link href={`/inbox/${msg.userMessageId}`}><Text numberOfLines={1} style={[styles.underline, {color: msg.read? colorPrimary : COLOR_PLAY}]}>{msg.message.substring(0, 100)}</Text></Link></View>
                                            <View className="grid-cell grid-cell-long grid-cell-end"><Text style={[styles.text, {color: msg.read? colorPrimary : COLOR_PLAY}]}>{
                                            dayjs.utc(msg.sendDate).local().format(
                                                dayjs.utc(msg.sendDate).local().isSame(dayjs(), 'year') ? 'MMM DD' : 'MMM DD, YYYY'
                                            )}</Text></View>
                                        </View>
                                    )
                                })}

                                <InboxPager hasMoreData={hasMoreData} page={page} totalPages={totalPages} loadData={loadData} />
                            </View>
                        )}
                </View>
            </ScrollView>
        </View>
    );
}