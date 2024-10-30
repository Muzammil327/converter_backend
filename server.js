const express = require('express');
const cors = require('cors');
const path = require('path');
const { convertImage } = require('./controller/imageController');
const { convertAudio } = require('./controller/audioController');
const { mergeVideos } = require('./controller/videoController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to handle CORS
app.use(
    cors({
        origin: [
            "https://converter-frontend-rosy.vercel.app",
            "http://localhost:3000",
            "http://localhost:3001"
        ],
        credentials: true,
    })
);

// Endpoints
app.post('/convert/image', convertImage);
app.post('/convert/audio', convertAudio);
app.post('/merge/videos', mergeVideos);

app.use('/uploads/image', express.static(path.join(__dirname, 'uploads/image')));
app.use('/uploads/audio', express.static(path.join(__dirname, 'uploads/audio')));
app.use('/merged', express.static(path.join(__dirname, 'merged')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
