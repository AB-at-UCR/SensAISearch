import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Search from './components/Search';
import './sensei-theme.css';

const App: React.FC = () => {
    return (
        <Router>
            {/* Splash background and overlay */}
            <div className="sensei-splash-bg"></div>
            <div className="sensei-splash-overlay"></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
                <header className="sensei-header">
                    <span role="img" aria-label="ninja">🥷</span> Sens-AI-Search
                    <div className="sensei-subheader">
                        Find images by text or upload, powered by AI <span role="img" aria-label="spark">✨</span>
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