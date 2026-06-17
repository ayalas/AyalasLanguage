import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { AuthHeader } from '../components/auth/AuthHeader';
import type { User } from '../types/shared/User';
import { errorHandler } from '../utils/utils';

export default function Homepage() {
  const [error, setError] = useState('');
  const { user } = useOutletContext<{ user: User | null }>();
  useEffect(() => {
    const loadData = async function () {
      try {
        console.log('todo');
      } catch (err: unknown) {
        errorHandler(err, setError);
      }
    };

    loadData();
  }, [user]);
  return (
    <>
      <AuthHeader />
      <div className="home-container">
        {error !== '' && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )}
      </div >
    </>
  );
}
