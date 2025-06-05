import React, { useState } from 'react';

const ImageUpload = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [error, setError] = useState(null);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(URL.createObjectURL(file));
            setError(null);
        } else {
            setError('Please select a valid image file.');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedImage) {
            setError('Please upload an image before submitting.');
            return;
        }

        // Logic to send the image to the backend for retrieval
        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const response = await fetch('/api/image-retrieval', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Image retrieval failed.');
            }

            // Handle successful response (e.g., update state with results)
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="image-upload">
            <form onSubmit={handleSubmit}>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                <button type="submit">Upload Image</button>
            </form>
            {error && <p className="error">{error}</p>}
            {selectedImage && <img src={selectedImage} alt="Selected" />}
        </div>
    );
};

export default ImageUpload;