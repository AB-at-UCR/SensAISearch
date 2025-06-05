# Image Retrieval UI

This project is a web application that allows users to upload an image and receive corresponding matches based on the uploaded image. It is built using React and TypeScript.

## Project Structure

```
image-retrieval-ui
├── public
│   └── index.html          # Main HTML file serving as the entry point
├── src
│   ├── components          # Contains reusable components
│   │   ├── ImageUpload.tsx # Component for uploading images
│   │   ├── MatchResults.tsx # Component for displaying match results
│   │   └── Navbar.tsx      # Navigation bar component
│   ├── pages               # Contains page components
│   │   └── Home.tsx        # Main page integrating components
│   ├── App.tsx             # Main application component
│   ├── api                 # API interaction functions
│   │   └── imageRetrieval.ts # Functions for image upload and retrieval
│   └── styles              # CSS styles for the application
│       └── main.css        # Main stylesheet
├── package.json            # npm configuration file
├── tsconfig.json           # TypeScript configuration file
└── README.md               # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd image-retrieval-ui
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to view the application.

## Usage

- Use the **Upload Image** feature to select and upload an image.
- The application will process the image and display matching results.
- Navigate through the application using the navigation bar.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.