import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { Inbox, Send } from "lucide-react-native";
import api from "@/lib/api";

import { errorHandler } from "@ayalaslanguage/types/error";
import type { InboxUserMessage, SendMessageRequest, SendMessageResponse } from '@ayalaslanguage/types/sharedfrontlib/inbox';
import { FormHeader } from "@/components/FormHeader";
import SecuredHeader from "@/components/SecuredHeader";
import type { LearningPathInfo } from "@ayalaslanguage/types/sharedfrontlib/learning";

import useTextStyles from "@/lib/useTextStyles";

export default function SendMessagePage() {
    const { learningPathId, inResponseToMessageId } = useLocalSearchParams<{ learningPathId?: string, inResponseToMessageId?: string }>();
    const [messageSent, setMessageSent] = useState(false);
    const [message, setMessage] = useState("");
    const [replyingToMessage, setReplyingToMessage] = useState("");
    const [error, setError] = useState("");
    const [recepient, setRecepient] = useState("");
    const { styles } = useTextStyles();
     const router = useRouter();

    useEffect(() => {
        async function execAsync() {
            if (learningPathId != null) {
                //set recpient by lesson: protect nick name for privacy in this case
                const lesson = await api.get<LearningPathInfo>(`/api/learning/path/${learningPathId}`)
                setRecepient(`Author of "${lesson.data.name}"`);
            }
            else if (inResponseToMessageId != null) {
                //set recpient by message
                const msg = await api.get<InboxUserMessage>(`/api/inbox/message/${inResponseToMessageId}`)
                setRecepient(msg.data.fromUserName);
                setReplyingToMessage(msg.data.message);
            }
        }
        execAsync();
    }, [learningPathId, inResponseToMessageId])

    const handleSubmit = async () => {
        try {

            if (message.length == 0) {
                setError("Message must be filled.");
                return;
            }

            const req: SendMessageRequest = {
                message
            };

            if (inResponseToMessageId != null) {
                req.inResponseToUserMessageId = Number(inResponseToMessageId);
            }
            else if (learningPathId != null) {
                req.learningPathId = Number(learningPathId);
            }
            else {
                setError("Message must be sent in regards to a lesson or in response to another message.");
                return;
            }

            const res = await api.post<SendMessageResponse>('/api/inbox/message',
                req);

            if (res.data?.userMessageId > 0) {
                setMessageSent(true);
            }
            else {
                setError("Unexpected result returned from server.");
                return;
            }

        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    return (
        <View className="root">
            <SecuredHeader />
            <ScrollView className='form-container' showsVerticalScrollIndicator={false}>
                <View className="form-container">
                    <FormHeader title="Send Message" />
                    {messageSent ? (
                        <>
                            <View className="form-row">
                                <Text style={styles.h2}>Message sent successfully.</Text>
                            </View>
                            <View className="form-button-cell">
                                <TouchableOpacity testID="inbox" onPress={() => { router.replace('/inbox') }} className="form-button"><Inbox className="color-brand-primary" /><Text style={styles.text}>&nbsp;Inbox</Text></TouchableOpacity>
                            </View>
                        </>
                    ) :
                        (
                            <>
                                {error !== '' && (
                                    <View className="form-row">
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}
                                <View className="form-row">
                                    <View className="form-label-cell">
                                        <Text style={styles.label}>Recepient: </Text><Link href={inResponseToMessageId != null ? `/inbox/${inResponseToMessageId}`
                                            : `/author/path/${learningPathId}`}><Text style={styles.underline}>{recepient}</Text></Link>
                                    </View>
                                </View>
                                <View className="form-row">
                                    <View className="form-label-cell">
                                        <Text style={styles.dimmedText}>{replyingToMessage}</Text>
                                    </View>
                                </View>
                                <View className="form-row">
                                    <View className="form-input-long">
                                        <TextInput data-testid="message" multiline={true} numberOfLines={8} className="text-area-wide" maxLength={20000} value={message} onChangeText={setMessage} />
                                    </View>
                                </View>
                                <View className="buttons-container">
                                    <View className="form-button-cell">
                                        <TouchableOpacity data-testid="send" onPress={handleSubmit} className="form-button"><Send className="color-brand-primary" /><Text style={styles.text}> Send</Text></TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )
                    }
                </View>
            </ScrollView>
        </View>
    );
}