import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { errorHandler } from '@ayalaslanguage/types/error';
import { checkPasswordStrength, generatePasswordFeedback, handleKeyDown } from '../../utils/utils';
import { Save } from 'lucide-react';
import { PublicHeader } from '../../components/PublicHeader';
import { FormHeader } from '../../components/FormHeader';

export function ResetPasswordPage() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [accountChanged, setAccountChanged] = useState(false);
    const [userName, setUserName] = useState('');
    const [error, setError] = useState("");
    const newPasswordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      newPasswordRef.current?.focus();
        async function runAsync() {
            setUserName(searchParams.get('user')?.trim() ?? '');
        }
        runAsync();
    }, [searchParams]);

    async function submitAction() {
         try {

            if (token == null || token.length == 0) {
                setError("Error: no token received.")
                return;
            }

            if (userName == null || userName.length == 0) {
                setError("Error: no email address received.")
                return;
            }

            if (newPassword == null || newPasswordConfirm == null) {
                setError("New Password and Password Confirm are required.")
                return;
            }

            const newPasswordTrimmed = newPassword.trim();
            const newPasswordConfirmTrimmed = newPasswordConfirm.trim();
            if (newPasswordTrimmed.length == 0) {
                setError("New Password and Password Confirm are required. New Password contains only whitespace.")
                return;
            }

            if (newPasswordTrimmed != newPasswordConfirmTrimmed) {
                setError("New Password and Password Confirm must be identical.")
                return;
            }

            const resCheck = checkPasswordStrength(newPasswordTrimmed);
            if (!resCheck.isValid) {
                const feedback = generatePasswordFeedback(resCheck.checks);
                setError(feedback.message);
                return;
            }

            await axios.post('/api/auth/reset', { userName, password: newPassword, token: token });

            setError("");
            setAccountChanged(true);
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        await submitAction();
    };

    return (
        <>
            <PublicHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <FormHeader isPublic={true} title="Reset Password" />
                    {accountChanged ? (
                        <>
                            <div className="form-row">
                                <h3>Password changed successfully.</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-content-row"><Link to={`/login?user=${encodeURIComponent(userName)}`}>Log in</Link>&nbsp;and experience with the app.</div>
                            </div>
                        </>
                    ) : (
                        <>
                            {error !== "" && (
                                <div className="form-row">
                                    <label className="form-error">{error}</label>
                                </div>
                            )}
                            <div className="form-row">
                                <div className="form-label-cell">
                                    <label className="form-label">New Password</label>
                                </div>
                                <div className="form-input-cell">
                                    <input ref={newPasswordRef} data-testid="password" maxLength={32} type="password" required={true} className="form-input" value={newPassword} onKeyDown={(e) => handleKeyDown(e, confirmPasswordRef)} onChange={e => setNewPassword(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-label-cell">
                                    <label className="form-label">Confirm New Password</label>
                                </div>
                                <div className="form-input-cell">
                                    <input ref={confirmPasswordRef} data-testid="confirm-password" maxLength={32} type="password" required={true} 
                                    className="form-input" value={newPasswordConfirm} 
                                    onKeyDown={(e) => handleKeyDown(e, null, submitAction)} onChange={e => setNewPasswordConfirm(e.target.value)} />
                                </div>
                            </div>
                            <div className="buttons-container">
                                <div className="form-button-cell">
                                    <button data-testid="save" type="submit" className="form-button"><Save /> Save</button>
                                </div>
                            </div>
                        </>)}
                </form>
            </div>
        </>
    );
}