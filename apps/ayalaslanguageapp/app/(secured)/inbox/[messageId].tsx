import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { FormHeader } from "@/components/FormHeader";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import type { InboxUserMessage } from "@ayalaslanguage/types/sharedfrontlib/inbox";
import api from "@/lib/api";
import type { User } from "@ayalaslanguage/types/sharedfrontlib/user";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { errorHandler } from "@ayalaslanguage/types/error";
import { Inbox, Reply, Trash } from "lucide-react-native";
import SecuredHeader from "@/components/SecuredHeader";
import useTextStyles from "@/lib/useTextStyles";
import { useAuth } from "@/lib/AuthContext";
import InboxMessagesComponent from "@/components/inbox/InboxMessagesComponent";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function MessagePage() {
    const { messageId } = useLocalSearchParams<{ messageId?: string }>();
    const [error, setError] = useState("");
    const [msg, setMsg] = useState<InboxUserMessage | null>(null);
    const { user, login } = useAuth();
    const router = useRouter();
    const [recepient, setRecepient] = useState("");
    const { styles } = useTextStyles();

    useEffect(() => {
        async function runAsync() {
            try {
                const tmpMsg = await api.get<InboxUserMessage>(`/api/inbox/message/${messageId}`);
                setMsg(tmpMsg.data);

                setRecepient(tmpMsg.data.toUserId == user?.userId ? "Me" : tmpMsg.data.contactName != "" ? tmpMsg.data.contactName :
                    `Author of "${tmpMsg.data.learningPathName}"`);
                //if (msg.data.learningPathName)
                if (tmpMsg.data.readWithRequest) {
                    //reduce the number of unread messages for the user
                    const tmp: User = { ...user } as User;
                    if (tmp.unreadMessages != null && tmp.unreadMessages > 0) {
                        tmp.unreadMessages = tmp.unreadMessages - 1;
                        login(tmp);
                    }

                }
            } catch (err: unknown) {
                errorHandler(err, setError);
            }
        }
        runAsync();

    }, [messageId]);

    const deleteMessage = async () => {
        try {
            await api.delete<InboxUserMessage>(`/api/inbox/message/${messageId}`);

            router.replace('/inbox');
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    return (
        <View className="root">
            <SecuredHeader />
            <ScrollView className='form-container' showsVerticalScrollIndicator={false}>
                <View className="form-container">
                    <FormHeader title="Message" />
                    {error !== '' && (
                        <View className="form-row">
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                    {msg != null && (
                        <>
                            <View className="form-row">
                                <View className="form-label-cell">
                                    <Text style={styles.label}>From: {msg.fromUserId == user?.userId ? "Me" : msg.fromUserName}</Text>
                                </View>
                            </View>

                            <View className="form-row">
                                <View className="form-label-cell">
                                    <Text style={styles.label}>To: </Text><Link href={msg.inResponseToMessageId != null ? `/inbox/${msg.inResponseToMessageId}`
                                            : `/author/path/${msg.learningPathId}`}><Text style={styles.underline}>{recepient}</Text></Link><Text style={styles.label}>{msg.inResponseToMessageId != null ? "" : " (lesson)"}</Text>
                                </View>
                            </View>

                            <View className="form-row">
                                <View className="form-input-long">
                                    <TextInput data-testid="message" multiline={true} numberOfLines={8} className="text-area-wide text-area-ro" value={msg.message} />
                                </View>
                            </View>

                            <View className="form-row">
                                <View className="form-label-cell">
                                    <Text style={styles.label}>Sent: {dayjs.utc(msg.sendDate).local().format('MMM DD, YYYY HH:mm')}</Text>
                                </View>
                            </View>
                            <InboxMessagesComponent showOnNoData={false} title="Replies" inResponseToMessageId={msg.userMessageId}  />
                            <View className="buttons-container">
                                {msg.fromUserId == user?.userId && (
                                    <>
                                        <View className="form-button-cell">
                                            <TouchableOpacity testID="delete" onPress={deleteMessage} className="form-button"><Trash className="color-brand-primary" /><Text style={styles.text}>&nbsp;Delete Message</Text></TouchableOpacity>
                                        </View>
                                        {msg.inResponseToMessageId != null && (
                                            <View className="form-button-cell">
                                                <TouchableOpacity testID="reply-again" onPress={() => { router.replace(`/inbox/message?inResponseToMessageId=${msg.inResponseToMessageId}`) }} className="form-button"><Reply className="color-brand-primary" /><Text style={styles.text}>&nbsp;Reply Again</Text></TouchableOpacity>
                                            </View>
                                        )}
                                    </>
                                ) || (
                                        <View className="form-button-cell">
                                            <TouchableOpacity testID="reply" onPress={() => { router.replace(`/inbox/message?inResponseToMessageId=${msg.userMessageId}`) }} className="form-button"><Reply className="color-brand-primary" /><Text style={styles.text}>&nbsp;Reply</Text></TouchableOpacity>
                                        </View>
                                    )}
                                <View className="form-button-cell">
                                    <TouchableOpacity testID="inbox" onPress={() => { router.replace('/inbox') }} className="form-button"><Inbox className="color-brand-primary" /><Text style={styles.text}>&nbsp;Back to Inbox</Text></TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}