import { useState } from 'react';

import { AuthHeader } from '../components/AuthHeader';

export function ChangePassword() {

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordChanged, setPasswordChanged] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (response.ok) {
                setPasswordChanged(true);
            } else {
                alert(`${response.statusText} (${response.status})`);
            }
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                {
                    passwordChanged && (
                        <h3>Password changed successfully.</h3>
                    )
                    || (
                        <form onSubmit={handleSubmit}>
                            <div className="form-header">
                                <h1>Change Password</h1>
                            </div>
                            <div className="form-row">
                                <div className="form-label-cell">
                                    <label className="form-label">Old Password</label>
                                </div>
                                <div className="form-input-cell">
                                    <input type="password" className="form-input" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-label-cell">
                                    <label className="form-label">New Password</label>
                                </div>
                                <div className="form-input-cell">
                                    <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-input-cell"></div>
                                <div className="form-input-cell">
                                    <button type="submit" className="form-button">Change Password</button>
                                </div>
                            </div>
                        </form>
                    )
                }
            </div>
        </>
    );
}