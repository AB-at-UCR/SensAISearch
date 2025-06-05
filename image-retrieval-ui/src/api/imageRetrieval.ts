import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Adjust the URL as needed

export const uploadImage = async (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // Assuming the response contains the matches
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

export const getMatches = async (imageId) => {
    try {
        const response = await axios.get(`${API_URL}/matches/${imageId}`);
        return response.data; // Assuming the response contains the match results
    } catch (error) {
        console.error('Error retrieving matches:', error);
        throw error;
    }
};