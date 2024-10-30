const formidable = require('formidable');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const convertImage = (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: 'Error parsing the file.' });
        }

        const inputFile = files.image[0].filepath;

        const outputDir = path.join(__dirname, '../uploads/image');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputFile = path.join(outputDir, `${Date.now()}.webp`);

        ffmpeg(inputFile)
            .toFormat('webp')
            .on('end', () => {
                res.status(200).json({ message: 'Conversion successful', output: `/uploads/image/${path.basename(outputFile)}` });
                fs.unlinkSync(inputFile);
            })
            .on('error', (error) => {
                console.error('Error converting file:', error);
                res.status(500).json({ error: 'Failed to convert image.' });
            })
            .save(outputFile);
    });
};

module.exports = { convertImage };
