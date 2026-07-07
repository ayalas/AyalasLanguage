import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

import { AuthHeader } from '../components/auth/AuthHeader';
import type { User } from '../types/User';
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import { DASHBOARD_RANG_FILTER, JOB_FILTER, type DashboardRangFilter, type IDashboardCounters } from '../types/grids/grids';
import { CONTENT_STATUS } from '@ayalaslanguage/types/exercise';

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
    let tempFilter: DashboardRangFilter = rangeFilter;
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
          <div className="dashboard-container">

            <div className="dashboard-counter">
              <Link className='dashboard-counter-link' to="/contactus">
                <div className="dashboard-counter-element">
                  {dashboardData.contactUsRecordsTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Contact Us Records
                </div>
              </Link>
            </div>

            <div className="dashboard-counter counter-errors">
              <Link className='dashboard-counter-link' to="/log">
                <div className="dashboard-counter-element">
                  {dashboardData.logsTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Logs
                </div>
              </Link>
            </div>

            

            <div className="dashboard-counter">
              <Link className='dashboard-counter-link' to="/paths">
                <div className="dashboard-counter-element">
                  {dashboardData.lessonsTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Lessons
                </div>
              </Link>
            </div>

            <div className="dashboard-counter counter-requires-work">
              <Link className='dashboard-counter-link' to={`/paths?status=${CONTENT_STATUS.DRAFT}`}>
                <div className="dashboard-counter-element">
                  {dashboardData.draftLessonsTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Draft Lessons
                </div>
              </Link>
            </div>


            <div className="dashboard-counter">
              <Link className='dashboard-counter-link' to="/exercises">
                <div className="dashboard-counter-element">
                  {dashboardData.exercisesTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Exercises
                </div>
              </Link>
            </div>

            <div className="dashboard-counter">
              <Link className='dashboard-counter-link' to="/users">
                <div className="dashboard-counter-element">
                  {dashboardData.usersTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Users
                </div>
              </Link>
            </div>

            <div className="dashboard-counter counter-warnings">
               <Link className='dashboard-counter-link' to="/logins">
                <div className="dashboard-counter-element">
                  {dashboardData.loginsTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Logins
                </div>
              </Link>
            </div>

            <div className="dashboard-counter counter-requires-work">
              <Link className='dashboard-counter-link' to={`/jobs?filter=${JOB_FILTER.INCOMPLETE}`}>
                <div className="dashboard-counter-element">
                  {dashboardData.incompleteJobsTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Incomplete Jobs
                </div>
              </Link>
            </div>

            <div className="dashboard-counter counter-errors">
              <Link className='dashboard-counter-link' to={`/jobs?filter=${JOB_FILTER.FAILED}`}>
                <div className="dashboard-counter-element">
                  {dashboardData.failedJobsTotal}
                </div>
                <div className="dashboard-counter-smallelement">
                  Failed Jobs
                </div>
              </Link>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
