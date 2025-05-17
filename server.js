const express = require('express');
const cors = require('cors');
const ytdl = require('yt-dlp-exec');
const fs = require('fs');
const app = express();
const path = require('path');
const port = 10000;

app.use(cors());
app.use(express.json());

// Helper to sanitize filenames
function sanitizeFilename(name) {
    return name.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim();
}

// Full HD Instagram Reel download route
app.get('/download/instagram', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url || !url.includes('instagram.com')) {
            return res.status(400).json({ error: 'Invalid Instagram URL' });
        }

        const cookiesPath = path.join(__dirname, 'cookies.txt');
        if (!fs.existsSync(cookiesPath)) {
            return res.status(500).json({ error: 'cookies.txt not found. Please export your Instagram login cookies.' });
        }

        // Get video info first
        const info = await ytdl(url, {
            dumpJson: true,
            noCheckCertificates: true,
            cookies: cookiesPath
        });

        if (!info || !info.title) {
            return res.status(404).json({ error: 'Video information could not be retrieved' });
        }

        const title = info.title || 'instagram_reel';
        const cleanTitle = title.replace(/[^\w\s]/gi, '');
        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Pipe full HD video
        ytdl(url, {
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
            mergeOutputFormat: 'mp4',
            noCheckCertificates: true,
            cookies: cookiesPath,
            stdout: true
        }).pipe(res);

    } catch (error) {
        console.error('Instagram Full HD download error:', error);
        res.status(500).json({ 
            error: 'Failed to download video in Full HD',
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
