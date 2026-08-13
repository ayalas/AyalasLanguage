import { FormHeader } from "../../components/FormHeader";
import { InboxMessagesComponent } from "../../components/inbox/InboxMessagesComponent";

export function InboxPage() {
    return (
        <>
            <div className="form-container">
                <FormHeader isPublic={false} title="Inbox" />
                <InboxMessagesComponent showOnNoData={true} />
            </div>
        </>
    );
}