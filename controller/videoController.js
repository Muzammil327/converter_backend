const formidable = require('formidable');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const cloudinary = require('../lib/cloudinaryConfig');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// const tempDir = path.join(__dirname, '../uploads/video');
const tempDir = path.join(os.tmpdir(), 'uploads/video');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const mergeVideos = (req, res) => {
    const form = new formidable.IncomingForm();

    console.log('Starting file upload...');

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: 'Error parsing the files.' });
        }

        console.log("File upload complete. Starting video merge...");

        const videoFiles = Object.values(files.video).map(file => file.filepath);

        if (videoFiles.length === 0) {
            return res.status(400).json({ error: 'No video files uploaded.' });
        }

        // Move uploaded files to the temp directory
        const movedFiles = [];
        try {
            for (const video of videoFiles) {
                const targetPath = path.join(tempDir, path.basename(video));
                await fs.move(video, targetPath, { overwrite: true });
                movedFiles.push(targetPath);
            }
        } catch (error) {
            console.error('Error moving files:', error.message);
            return res.status(500).json({ error: 'Failed to move video files.' });
        }

        const outputVideoPath = path.join(tempDir, 'output.mp4'); // Specify the output path

        const ffmpegCommand = ffmpeg();

        // Add each video file as an input without applying individual filters
        movedFiles.forEach(file => ffmpegCommand.input(file));

        ffmpegCommand
            .complexFilter(
                // Scale each video to a common resolution and frame rate within the filter_complex
                movedFiles.map((_, index) => `[${index}:v]scale=640:360,fps=30[v${index}];[${index}:a]anull[a${index}]`).join(';') +
                ';' + movedFiles.map((_, index) => `[v${index}][a${index}]`).join('') +
                `concat=n=${movedFiles.length}:v=1:a=1[outv][outa]`,
                ['outv', 'outa']
            )
            .output(outputVideoPath) // Specify the output file here
            .on('start', () => {
                console.log('Merging videos...');
            })
            .on('end', async () => {
                console.log('Merging finished!');

                const mergedVideoId = `merged_video_${new Date().toISOString().replace(/[-:.]/g, '_')}`;

                try {
                    const cloudinaryUpload = await cloudinary.uploader.upload(outputVideoPath, {
                        resource_type: 'video',
                        public_id: mergedVideoId, // Customize the public ID if needed
                        overwrite: true, // Overwrite existing files with the same public ID
                    });

                    res.status(200).json({
                        message: 'Videos merged and uploaded successfully!',
                        url: cloudinaryUpload.secure_url // Get the URL of the uploaded video
                    });
                } catch (error) {
                    console.error('Error uploading to Cloudinary:', error.message);
                    res.status(500).json({ error: 'Failed to upload merged video to Cloudinary.' });
                }
            })
            .on('error', (error) => {
                console.error('Error merging videos:', error.message);
                res.status(500).json({ error: 'Failed to merge videos. ' + error.message });
            })
            .run();
    });
};

module.exports = { mergeVideos };
