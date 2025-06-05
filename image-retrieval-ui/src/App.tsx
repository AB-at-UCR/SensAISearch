import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Search from './components/Search';
import './sensei-theme.css';

const App: React.FC = () => {
    return (
        <Router>
            <div>
                <header className="sensei-header">
                    SenseiSearch
                    <div className="sensei-subheader">
                        Find images by text or upload, powered by AI
                    </div>
                </header>
                <Switch>
                    <Route path="/" component={Search} />
                </Switch>
            </div>
        </Router>
    );
};

export default App;