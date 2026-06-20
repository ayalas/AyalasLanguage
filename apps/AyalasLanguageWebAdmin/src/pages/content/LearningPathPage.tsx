import { useParams } from 'react-router-dom';
import axios from 'axios';
import { errorHandler } from '@ayalaslanguage/types/error';
import { AuthHeader } from '../../components/auth/AuthHeader';
import ExercisesGrid from '../../components/ExercisesGrid';
import { useEffect, useState } from 'react';
import { CONTENT_STATUS_MAPPING, type IRowLearningPath } from '../../types/grids/grids';
import { type ContentStatus } from '@ayalaslanguage/types/exercise';
import dayjs from 'dayjs';

export function LearningPathPage() {
    const { learningPathId } = useParams();
    const [error, setError] = useState('');
    const [record, setRecord] = useState<IRowLearningPath | null>(null);


    useEffect(() => {
        async function runAsync() {
            try {
                const res = await axios.get<IRowLearningPath>(`/admin/api/learning-path/${learningPathId}`);
                setRecord(res.data);
            }
            catch (err) {
                errorHandler(err, setError);
            }
        }
        runAsync();
    }, [learningPathId]);

    return (
        <>
            <AuthHeader />
            <div className="form-header">
                <h1>Lesson {record?.level}-{record?.chapter}: {record?.name}</h1>
            </div>
            {error !== '' && (
                <div className="form-row">
                    <label className="form-error">{error}</label>
                </div>
            )}
            <div className="form-row">
                <div className="form-label-cell">
                    <label className="form-label">Email Address: {record?.email}</label>
                </div>
                <div className="form-label-cell">
                    <label className="form-label">Known Language: {record?.knownLanguage}</label>
                </div>
                <div className="form-label-cell">
                    <label className="form-label">Target Language: {record?.targetLanguage}</label>
                </div>
                <div className="form-label-cell">
                    <label className="form-label">Level: {record?.level}</label>
                </div>
                <div className="form-label-cell">
                    <label className="form-label">Chapter: {record?.chapter}</label>
                </div>
                <div className="form-label-cell">
                    <label className="form-label">Subject: {record?.name}</label>
                </div>
                <div className="form-label-cell">
                    <label className="form-label">Status: {CONTENT_STATUS_MAPPING[record?.status as ContentStatus]}</label>
                </div>
                <div className="form-label-cell">
                    <label className="form-label">Created On: {dayjs(record?.createdOn).format('YYYY-MM-DD HH:mm')}</label>
                </div>
                <div className="form-label-cell">
                    <label className="form-label">Exercises: {record?.countExercises}</label>
                </div>
            </div>
            <ExercisesGrid learningPathId={Number(learningPathId)} />
        </>
    );
}