import { View, ScrollView } from "react-native";
import { FormHeader } from "@/components/FormHeader";
import InboxMessagesComponent from "@/components/inbox/InboxMessagesComponent";

export default function InboxPage() {
    return (
        <View className="root">
            <ScrollView className='form-container' showsVerticalScrollIndicator={false}>
                <View className="form-container">
                    <FormHeader title="Inbox" />
                    <InboxMessagesComponent showOnNoData={true} />
                </View>
            </ScrollView>
        </View>
    );
}