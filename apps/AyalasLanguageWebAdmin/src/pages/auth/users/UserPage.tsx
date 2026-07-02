import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ROLE_MAPPING, type IUserDetails } from "../../../types/auth/auth";
import axios from "axios";
import { errorHandler } from "@ayalaslanguage/types/error";
import { AuthHeader } from "../../../components/auth/AuthHeader";
import type { RoleType } from "@ayalaslanguage/types/auth";
import dayjs from "dayjs";

export function UserPage() {
    const { userId } = useParams();
    const [error, setError] = useState('');
    const [record, setRecord] = useState<IUserDetails | null>(null);

    useEffect(() => {
        async function runAsync() {
            try {
                const res = await axios.get<IUserDetails>(`/admin/api/auth/user/${userId}`);
                setRecord(res.data);
            }
            catch (err) {
                errorHandler(err, setError);
            }
        }
        runAsync();
    }, [userId]);

    return (
        <>
            <AuthHeader />
            <div className="form-header">
                <h1>User {record && record?.displayName}</h1>
            </div>
            {error !== '' && (
                <div className="form-row">
                    <label className="form-error">{error}</label>
                </div>
            )}
            {record && (
                <>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Display Name: {record?.displayName}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Email address: {record?.userName}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Role: {ROLE_MAPPING[record?.role as RoleType]}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Created On: {dayjs(record?.createdOn).format('YYYY-MM-DD HH:mm') }</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Target Language: {record?.targetLanguage}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Known Language: {record?.knownLanguage}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <div className="form-label">Email confirmed: <input type="checkbox" disabled={true} checked={record?.emailConfirmed} /></div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <div className="form-label">Two Factor Authentication: <input type="checkbox" disabled={true} checked={record?.use2FALogin} /></div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Puter is Disabled: <input type="checkbox" disabled={true} checked={record?.disablePuter} /></label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Number of Exercises to Generate: {record?.numOfExercisesToGenerate}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Forgot Email Sent: {dayjs(record?.forgotEmailSent).format('YYYY-MM-DD HH:mm')}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Forgot Email Sent: {dayjs(record?.forgotEmailSent).format('YYYY-MM-DD HH:mm')}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Forgot Email Received: {dayjs(record?.emailConfirmationReceived).format('YYYY-MM-DD HH:mm')}</label>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Email Confirmation Sent: {dayjs(record?.confirmationEmailSent).format('YYYY-MM-DD HH:mm')}</label>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}