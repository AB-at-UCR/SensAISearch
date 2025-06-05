import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import MatchResults from '../components/MatchResults';

const Home: React.FC = () => {
    const [matches, setMatches] = useState<string[]>([]);

    const handleImageUpload = async (imageFile: File) => {
        // Logic to handle image upload and retrieval of matches
        // This is where you would call the API to get matches based on the uploaded image
        // For now, we'll simulate it with a placeholder
        const simulatedMatches = ['Match 1', 'Match 2', 'Match 3'];
        setMatches(simulatedMatches);
    };

    return (
        <div>
            <h1>Image Retrieval System</h1>
            <ImageUpload onImageUpload={handleImageUpload} />
            <MatchResults matches={matches} />
        </div>
    );
};

export default Home;