const express = require('express');
const cors = require('cors');
const ytdl = require('yt-dlp-exec');
const app = express();
const path = require('path');
const port = 3001;

app.use(cors());
app.use(express.json());

// Helper to sanitize filenames
function sanitizeFilename(name) {
    return name.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim();
}

// Instagram download endpoint
app.get('/download/instagram', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url || !url.includes('instagram.com')) {
            return res.status(400).json({ error: 'Invalid Instagram URL' });
        }

        const info = await ytdl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            preferFreeFormats: true,
            extractorArgs: ['instagram:username=your_username', 'instagram:password=your_password']
        });

        const title = sanitizeFilename(info.title || 'instagram_video');
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);

        // Stream the video
        ytdl.exec(url, {
            format: 'best[ext=mp4]',
            noCheckCertificates: true,
            output: '-', // stream to stdout
        }, { stdio: ['ignore', 'pipe', 'ignore'] }).stdout.pipe(res);

    } catch (error) {
        console.error('Instagram download error:', error);
        res.status(500).json({
            error: 'Failed to download Instagram video',
            details: error.message
        });
    }
});

// YouTube download endpoint
app.get('/download/youtube', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
        });

        const title = sanitizeFilename(info.title || 'youtube_video');
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);

        // Stream the video
        ytdl.exec(url, {
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
            noCheckCertificates: true,
            output: '-',
        }, { stdio: ['ignore', 'pipe', 'ignore'] }).stdout.pipe(res);

    } catch (error) {
        console.error('YouTube download error:', error);
        res.status(500).json({
            error: 'Failed to download YouTube video',
            details: error.message
        });
    }
});

// Route to serve index.html at "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
