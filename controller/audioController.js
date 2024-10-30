const formidable = require('formidable');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Set FFmpeg path if needed (optional, ffmpeg-static handles it)
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

// Function to handle the audio conversion
const convertAudio = (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: 'Error parsing the file.' });
        }

        // Check if the file is present
        if (!files.audio || files.audio.length === 0) {
            return res.status(400).json({ error: 'No audio file uploaded.' });
        }

        const inputFile = files.audio[0].filepath; // Access the first file uploaded
        const outputFileName = `${Date.now()}.wav`;
        const outputFile = path.join(__dirname, '../uploads/audio', outputFileName);

        ffmpeg(inputFile)
            .toFormat('wav')
            .on('end', () => {
                console.log('Conversion finished successfully');
                res.status(200).json({ message: 'Conversion successful', output: outputFileName });
                // Optionally delete the input file after conversion
                fs.unlinkSync(inputFile);
            })
            .on('error', (error) => {
                console.error('Error converting file:', error);
                res.status(500).json({ error: 'Failed to convert audio.' });
            })
            .save(outputFile);
    });
};

module.exports = { convertAudio };
