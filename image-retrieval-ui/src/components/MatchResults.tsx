import React from 'react';

interface MatchResult {
    id: string;
    caption: string;
    imagePath: string;
}

interface MatchResultsProps {
    results: MatchResult[];
}

const MatchResults: React.FC<MatchResultsProps> = ({ results }) => {
    return (
        <div className="match-results">
            <h2>Match Results</h2>
            {results.length === 0 ? (
                <p>No matches found.</p>
            ) : (
                <ul>
                    {results.map(result => (
                        <li key={result.id}>
                            <img src={result.imagePath} alt={result.caption} />
                            <p>{result.caption}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MatchResults;