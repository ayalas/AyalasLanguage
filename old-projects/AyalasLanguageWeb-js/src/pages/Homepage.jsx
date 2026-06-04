
import { useEffect, useState, Fragment } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { LayersPlus, Check, CircleDotDashed, History } from 'lucide-react';

import { AuthHeader } from '../components/auth/AuthHeader';
import { LEANRING_STATUS } from '../constants/learning';

export function Homepage() {
    const [learningPath, setLearningPath] = useState([]);
    const [error, setError] = useState("");
    const [hasLangauge, setHasLangauge] = useState(false);
    const { user } = useOutletContext();
    useEffect(() => {
        const loadData = async function () {
            try {
                if (user.languageSettings.targetLanguageId != null &&
                    user.languageSettings.knownLanguageId != null 
                ) {
                    setHasLangauge(true);
                }
                else {
                    return;
                }
                const response = await axios.get('/api/learning/path');

                if (response.data != null) {
                    const learningPaths = response.data;

                    //group by level
                    const transformedArray = Object.values(
                        learningPaths.reduce((acc, current) => {
                            // If this level doesn't exist in our accumulator yet, create it
                            if (!acc[current.level]) {
                                acc[current.level] = {
                                    level: current.level,
                                    paths: []
                                };
                            }

                            // Push the current object into the appropriate level's paths array
                            acc[current.level].paths.push(current);

                            return acc;
                        }, {})
                    );

                    setLearningPath(transformedArray);
                }
            } catch (err) {
                setError(err.message);
            }
        };

        loadData();
    }, [user]);
    return (
        <>
            <AuthHeader hideAppTitle={true} />
            <div className="home-container">
                <h1>Ayala's Language App</h1>
                {error != "" && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}
                {(learningPath && learningPath.length > 0) && (
                    <div className="learning-container">
                        {
                            learningPath.map((level, levelIndex) => {
                                return (

                                    <div className="learning-level-container" key={`level-${level.level}`}>
                                        <h4>Level {level.level}</h4>
                                        {
                                            level.paths.map((path, index) => {
                                                const isDone = path.status == LEANRING_STATUS.DONE;
                                                const isInProgress = path.status == LEANRING_STATUS.IN_PROGRESS;
                                                return (
                                                    <Fragment key={path.learningPathId}>
                                                        { index == 0 && levelIndex == 0 && (
                                                            <div className="learning-level-creator">
                                                                <Link 
                                                                    to={`/author/path?next=${level.paths[0].learningPathId}`} 
                                                                    title="Generate more exercises here"><LayersPlus /></Link>
                                                            </div>
                                                        )}
                                                        <div className="learning-lesson" >
                                                            {path.chapter} <Link className={`learning-lesson-link${isDone ? " lesson-done" : ""}`} to={`/path/${path.learningPathId}`}>{path.name}</Link>
                                                            {isDone && (
                                                                <Check className="learning-progress-img" title="done" />
                                                            )}
                                                            {isInProgress && (
                                                                <CircleDotDashed className="learning-progress-img" title="in progress" />
                                                            )}
                                                            {
                                                                path.practiseMistakesInThisPath && (
                                                                    <History className="learning-progress-img" title="mistakes will be readded to this lesson" />
                                                                )
                                                            }
                                                            <div className="content-line-part">[{path.exerciseCount}]</div>
                                                        </div>
                                                        <div className="learning-level-creator">
                                                            <Link 
                                                                to={`/author/path?level=${path.level}&chapter=${path.chapter+1}&prev=${path.learningPathId}${
                                                                    level.paths.length -1 == index? "": `&next=${level.paths[index+1].learningPathId}`
                                                                }`} 
                                                                title="Generate more exercises here"><LayersPlus /></Link>
                                                        </div>
                                                    </Fragment>
                                                );
                                            })
                                        }
                                    </div>


                                );
                            })
                        }

                    </div>
                ) || (hasLangauge && (
                        <div className="learning-path-empty">
                            It looks like there are not yet any lessons in this language.<br />
                            But you can <Link to="/author/path">add ones yourself!</Link>
                        </div>
               )) || (
                        <div className="learning-path-empty">
                            You have not selected which language to learn.<br />
                            Go to <Link to="/profile">the profile page</Link> to choose one!
                        </div>
               )
                }</div>
        </>
    );
}