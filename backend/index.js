const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const ytpl = require('@distube/ytpl');
require('dotenv').config({ path: './config/.env' });
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT;

const convertToFullURL = (shortUrl) => {
    const match = shortUrl.match(/youtu\.be\/([^?&]+)/);
    return match ? `https://www.youtube.com/watch?v=${match[1]}` : shortUrl;
};

app.post('/get-videos', async (req, res) => {        
    const { url } = req.body;
    const fullUrl = convertToFullURL(url);

    try {
        if (fullUrl.includes('playlist')) {
            const playlistId = new URL(fullUrl).searchParams.get('list');
            if (!playlistId) {
                return res.status(400).json({ error: 'Invalid playlist URL' });
            }

            const playlist = await ytpl(playlistId);
            const videoDetails = await Promise.all(playlist.items.map(async (video) => {
                const videoUrl = convertToFullURL(video.url);
                try {
                    const info = await ytdl.getInfo(videoUrl);
                    return {
                        id: info.videoDetails.videoId,
                        title: info.videoDetails.title,
                        formats: info.formats
                    };
                } catch (err) {
                    console.error('Error retrieving info for video:', videoUrl, err);
                    return null;
                }
            }));

            const filteredVideoDetails = videoDetails.filter(video => video !== null);
            res.json({ videos: filteredVideoDetails });
        } else {
            const info = await ytdl.getInfo(fullUrl);
            const formats = info.formats;
            const defaultFormat = formats.find(f => f.qualityLabel === '144p') ||
                formats.find(f => f.qualityLabel === '360p') ||
                formats.find(f => f.qualityLabel === '720p');
            const video = {
                id: info.videoDetails.videoId,
                title: info.videoDetails.title,
                formats: formats,
                defaultFormat: defaultFormat
            };
            res.json({ videos: [video] });
        }
    } catch (err) {
        console.error('Error retrieving video information:', err);
        res.status(500).json({ error: 'Failed to retrieve video details' });
    }
});

// app.post('/download', async (req, res) => {          //ORIGINAL 
//     const { videoId, quality, format } = req.body;
//     const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

//     if (!ytdl.validateURL(fullUrl)) {
//         return res.status(400).json({ error: 'Invalid URL' });
//     }

//     try {
//         const info = await ytdl.getInfo(fullUrl);
//         const formats = info.formats;
//         // console.log(formats);
//         let chosenFormat;
//         if (format === 'mp3') {
//             chosenFormat = formats.find(f => f.mimeType && f.mimeType.includes('audio/mp4')) ||
//                 formats.find(f => f.mimeType && f.mimeType.includes('audio/webm')) ||
//                 formats.find(f => f.mimeType && f.mimeType.includes('audio/mpeg'));

//             if (!chosenFormat) {
//                 return res.status(400).json({ error: 'No suitable audio format available' });
//             }
//             // Set a default filename for MP3
//             res.setHeader('Content-Disposition', 'attachment; filename="default.mp3"');
//             ytdl(fullUrl, { format: chosenFormat, filter: 'audioonly' }).pipe(res);
//         } else {
//             chosenFormat = formats.find(f => f.qualityLabel === quality && f.mimeType.includes('video/mp4')) ||
//                 formats.find(f => f.qualityLabel === '360p') ||
//                 formats.find(f => f.qualityLabel === '720p');
//             if (!chosenFormat) {
//                 return res.status(400).json({ error: 'No suitable video format available' });
//             }
//             // Set a default filename for MP4
//             res.setHeader('Content-Disposition', 'attachment; filename="default.mp4"');
//             ytdl(fullUrl, { format: chosenFormat }).pipe(res);
//         }
//     } catch (err) {
//         console.error('Error retrieving video information:', err);
//         res.status(500).json({ error: 'Failed to retrieve video details' });
//     }
// });


app.post('/download', async (req, res) => {            //SECOND ORIGINAL
    const { videoId, quality, format } = req.body;
    const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

    if (!ytdl.validateURL(fullUrl)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const info = await ytdl.getInfo(fullUrl);
        const formats = info.formats;

        if (format === 'mp3') {
            // Audio only download
            const audioFormat = ytdl.chooseFormat(formats, { quality: 'highestaudio', filter: 'audioonly' });
            if (!audioFormat) {
                return res.status(400).json({ error: 'No suitable audio format found' });
            }
            res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
            ytdl(fullUrl, { format: audioFormat }).pipe(res);

        } else {
            // Video download
            // Try to find progressive format (audio+video combined) at requested quality
            let chosenFormat = formats.find(f => f.qualityLabel === quality && f.isProgressive);

            if (!chosenFormat) {
                // If not found and requested quality > 360p
                // fallback to video-only format (no audio)
                chosenFormat = formats.find(f => f.qualityLabel === quality && f.hasVideo && !f.hasAudio);

                if (!chosenFormat) {
                    // fallback to 360p progressive
                    chosenFormat = formats.find(f => f.qualityLabel === '360p' && f.isProgressive);
                    if (!chosenFormat) {
                        return res.status(400).json({ error: 'No suitable video format found' });
                    } else {
                        console.log('Falling back to 360p progressive format (audio+video combined)');
                    }
                } else {
                    console.log('Serving video-only format (no audio) at requested quality:', quality);
                }
            } else {
                console.log('Serving progressive format (audio+video combined) at requested quality:', quality);
            }

            res.setHeader('Content-Disposition', `attachment; filename="video_${chosenFormat.qualityLabel}.mp4"`);
            ytdl(fullUrl, { format: chosenFormat }).pipe(res);
        }
    } catch (error) {
        console.error('Error during download:', error);
        res.status(500).json({ error: 'Failed to process download request' });
    }
});

app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});
