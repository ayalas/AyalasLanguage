import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { errorHandler } from '@ayalaslanguage/types/error';
import { handleKeyDown, isValidEmail } from '../../utils/utils';
import { Send } from 'lucide-react';
import { PublicHeader } from '../../components/PublicHeader';
import { TabLinksComponent } from '../../components/tabs/TabLinksComponent';
import { AUTH_TABS, AuthTabsEnum } from '../../constants/auth';

export function ForgotPage() {
    const [error, setError] = useState("");
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const emailRef = useRef<HTMLInputElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      emailRef.current?.focus();
        async function runAsync() {
            setEmail(searchParams.get('user') ?? '');
        }
        runAsync();
    }, [searchParams]);

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
            <PublicHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit} data-testid="main-form">
                    <TabLinksComponent tabData={AUTH_TABS} activeTab={AuthTabsEnum.ForgotPassword} />
                    
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
                                        <input ref={emailRef} data-testid="email" maxLength={128} type="text" value={email} required={true} className="form-input" onKeyDown={(e) => handleKeyDown(e, submitButtonRef)} onChange={e => setEmail(e.target.value)} />
                                    </div>
                                </div>
                            </>
                        )}
                    {!success && (
                        <div className="buttons-container">
                            <div className="form-input-row">
                                <button ref={submitButtonRef} type="submit" data-testid="complete-registration" className="form-button"><Send /> Send Reset Password Email</button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </>
    )
}