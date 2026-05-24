
import {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthHeader } from '../components/AuthHeader';


export function Homepage() {
    const [learningPath, setLearningPath] = useState([]);
    useEffect(() => {
        const loadData = async function () {
            const response = await axios.get('/api/learning/path');
            if (response.data != null) {
                setLearningPath(response.data);
            }
        };

        loadData();
    }, []);
    return (
        <>
            <AuthHeader />
            <div className="home-container">
                <h1>Home</h1>
                {(learningPath && learningPath.length > 0) && (
                    <div className="learning-path-container">
                    {
                        learningPath.map((path) => {
                            return (
                                <div className="learning-lesson" key={path.learningPathId}>
                                    {path.level}.{path.chapter} <Link to={`/author/path/${path.learningPathId}`}>{path.name}</Link>
                                </div>
                            );
                        })
                    }
                </div>
                ) || (
                    <div className="learning-path-empty">
                        It looks like there are not yet any lessons in this langauge.<br/>
                        But you can <Link to="/author/path">add ones yourself!</Link>
                    </div>
                )}
            </div>
        </>
    );
}