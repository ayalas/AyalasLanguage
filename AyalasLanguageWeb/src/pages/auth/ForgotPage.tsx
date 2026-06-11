import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { errorHandler, isValidEmail } from '../../utils/utils';
import { Send } from 'lucide-react';

export function ForgotPage() {
    const [error, setError] = useState("");
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        async function runAsync() {
            setEmail(searchParams.get('user') ?? '');
        }
        runAsync();
    },[searchParams]);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        try {
            if (!isValidEmail(email)) {
                setError("Please enter a valid email address");
                return;
            }

            await axios.post('/api/auth/forgot', { username: email });

            setSuccess(true);

        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    return (
        <>
            <div className="form-container">
                <form onSubmit={handleSubmit} data-testid="main-form">
                    <div className="form-header">
                        <h1>Reset Password</h1>
                    </div>
                    {!success && (
                        <div className="form-row">
                            <div className="form-input-row">
                                <button type="submit" data-testid="complete-registration" className="form-button"><Send /> Send Reset Password Email</button>
                            </div>
                        </div>
                    )}
                    {error !== "" && (
                        <div className="form-row">
                            <label className="form-error">{error}</label>
                        </div>
                    )}
                    {success && (
                        <>
                            <div className="form-row">
                                <h3>Email sent successfully.</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-content-row">An email address with a link to reset your password has been sent to '{email}'.</div>
                            </div>
                        </>
                    ) || (
                            <>
                                <div className="form-row">
                                    <div className="form-label-cell">
                                        <label className="form-label">Email</label>
                                    </div>
                                    <div className="form-input-cell">
                                        <input data-testid="email" type="text" value={email} required={true} className="form-input" onChange={e => setEmail(e.target.value)} />
                                    </div>
                                </div>
                            </>
                        )}
                </form>
                <div className="form-row">
                    <div className="login-register-line">Or <Link to="/login">Log in</Link> with your credentials</div>
                </div>
            </div>
        </>
    )
}