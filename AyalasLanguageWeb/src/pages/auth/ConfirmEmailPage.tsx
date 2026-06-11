import { useParams, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { User } from '../../types/shared/User';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { errorHandler } from '../../utils/utils';

export function ConfirmEmailPage() {
    const { token } = useParams();
    const { login } = useOutletContext<{ login: (u: User) => void }>();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function SendAsync() {
            try {
                if (token != null) {
                    const res = await axios.get(`/api/auth/confirm/${encodeURIComponent(token)}`)
                    login(res.data);
                    setSuccess(true);
                }
                else {
                    setError("Error: no token received.")
                }
            }
            catch (err) {
                errorHandler(err, setError);
            }
        }
        SendAsync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[token]);

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <div className="form-header">
                    <h1>Email address confirmation</h1>
                </div>
                {error !== "" && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}
                {success && (
                    <div className="form-row">
                        <h3>Email address confirmed successfully.</h3>
                    </div>
                )}
            </div>
        </>
    );
}