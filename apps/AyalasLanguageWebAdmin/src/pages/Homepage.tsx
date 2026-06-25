import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { AuthHeader } from '../components/auth/AuthHeader';
import type { User } from '../types/shared/User';
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import { DASHBOARD_RANG_FILTER, type DashboardRangFilter, type IDashboardCounters } from '../types/grids/grids';

export default function Homepage() {
  const [error, setError] = useState('');
  const [rangeFilter, setRangeFilter] = useState<DashboardRangFilter>(DASHBOARD_RANG_FILTER.ALL_TIME);
  const { user } = useOutletContext<{ user: User | null }>();
  const [dashboardData, setDashboardData] = useState<IDashboardCounters | null>(null);

  async function OnRangeFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tempValue = Number(e.target.value) as DashboardRangFilter;
    setRangeFilter(tempValue);
    localStorage.setItem('dashboardRangeFilter', tempValue.toString());
    await loadData(tempValue);
  }

  const loadData = async function (rangeFilterValue: DashboardRangFilter) {
    try {
      const res = await axios.get<IDashboardCounters>(`/admin/api/dashboard/counters/${rangeFilterValue}`);
      setDashboardData(res.data);
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  useEffect(() => {
    let tempFilter:DashboardRangFilter = rangeFilter;
    //load last selection of filter
    const savedFilterValue = localStorage.getItem('dashboardRangeFilter');
    if (savedFilterValue != null && savedFilterValue != "") {
      tempFilter = Number(savedFilterValue) as DashboardRangFilter;
      setRangeFilter(tempFilter);
    }

    loadData(tempFilter);
  }, [user]);
  return (
    <>
      <AuthHeader />
      <div className="home-container">
        <div className="form-row">
          <div className="form-input-cell">
            <div className="content-line-part">Time Range:</div>
            <div>
              <select required data-testid="timerangefilter" className="filter-select" value={rangeFilter} onChange={OnRangeFilterChange}>
                <option value={DASHBOARD_RANG_FILTER.ALL_TIME}>All time</option>
                <option value={DASHBOARD_RANG_FILTER.LAST_DAY}>Last 24 hours</option>
                <option value={DASHBOARD_RANG_FILTER.SEVEN_DAYS}>Last 7 Days</option>
                <option value={DASHBOARD_RANG_FILTER.THIRTY_DAYS}>Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
        {error !== '' && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )}
        {dashboardData && (
          <>
            <div className="form-row">
              <div className="form-input-cell">
                <div className="content-line-part">Contact Us Records:</div>
                <div className="content-line-part">{ dashboardData.contactUsRecordsTotal }
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <div className="content-line-part">Logs:</div>
                <div className="content-line-part">{ dashboardData.logsTotal }</div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <div className="content-line-part">Lessons:</div>
                <div className="content-line-part">{ dashboardData.lessonsTotal }</div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <div className="content-line-part">Draft Lessons:</div>
                <div className="content-line-part">{ dashboardData.draftLessonsTotal }</div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <div className="content-line-part">Exercises:</div>
                <div className="content-line-part">{ dashboardData.exercisesTotal }</div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <div className="content-line-part">Users:</div>
                <div className="content-line-part">{ dashboardData.usersTotal }</div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <div className="content-line-part">Logins:</div>
                <div className="content-line-part">{ dashboardData.loginsTotal }</div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
