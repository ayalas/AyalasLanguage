import { useParams } from 'react-router';
import { useEffect, useState, Fragment } from 'react';
import axios from 'axios';

import { AuthHeader } from '../../components/AuthHeader';
import { EXERCISE_TYPES, PLACEHOLDERS } from '../../constants/learning';
import { getMissingParts } from '../../utils/utils';

export function LessonPage() {
    const { learningPathId } = useParams();
    const [exercises, setExercises] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        async function getData() {
            try {
                const response = await axios.get('/api/learning/path/24/exercises');

                if (response && response.data && response.data.length > 0) {
                    setExercises(response.data);
                }
            } catch (err) {
                setError(err.message);
            }
        }
        getData();

    }, [learningPathId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('todo handleSubmit');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h1>Exercise</h1>
                    </div>
                    {error != "" && (
                        <div className="form-row">
                            <label className="form-error">{error}</label>
                        </div>
                    )}
                    {exercises &&
                        exercises.map((exItem) => {
                            let data = JSON.parse(exItem.data);
                            if (exItem.exerciseTypeId == EXERCISE_TYPES.FILL_IN_THE_BLANKS) {
                                let sentenceElements = data.First.split(PLACEHOLDERS.BLANKS);

                                let answers = getMissingParts(data.Second, sentenceElements);

                                let i = -1;
                                return (
                                    <Fragment key={`ex${exItem.exerciseId}row`}>
                                        <div className="form-label-row">
                                            {
                                                sentenceElements.map((part) => {
                                                    i++;
                                                    return (
                                                        <Fragment key={`ex${exItem.exerciseId}input${i}`}>
                                                            {i == 0 && part == "" && (
                                                                <input type="text" className="input-text-placeholder" style={{
                                                                    width: `${(1 + answers[i].length)}ch`
                                                                }}></input>
                                                            )}
                                                            {part}
                                                            {(i > 0 || part != "") && (answers.length > i) && (
                                                                <input type="text" className="input-text-placeholder" style={{
                                                                    width: `${(1 + answers[i].length)}ch`
                                                                }}></input>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })
                                            }</div>
                                        <div className="form-label-row">{data.Second}</div>
                                    </Fragment>
                                );
                            }
                        })
                    }
                    <div className="form-row">
                        <div className="form-input-row">
                            <button type="submit" className="leason-next">Check my answers</button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}