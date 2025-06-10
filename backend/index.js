
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
// const ytdl = require('ytdl-core');

app.post('/download', async (req, res) => {
  const { videoId, quality, format } = req.body;
  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (!ytdl.validateURL(fullUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const info = await ytdl.getInfo(fullUrl);
    const formats = info.formats;

    let chosenFormat;

    if (format === 'mp3') {
      chosenFormat =
        formats.find(f => f.mimeType && f.mimeType.includes('audio/mp4')) ||
        formats.find(f => f.mimeType && f.mimeType.includes('audio/webm')) ||
        formats.find(f => f.mimeType && f.mimeType.includes('audio/mpeg'));

      if (!chosenFormat) {
        return res.status(400).json({ error: 'No suitable audio format available' });
      }

      res.setHeader('Content-Disposition', 'attachment; filename="default.mp3"');
      ytdl(fullUrl, { format: chosenFormat, filter: 'audioonly' }).pipe(res);

    } else {
      // Video with audio (progressive format)
      chosenFormat =
        formats.find(f =>
          f.qualityLabel === quality &&
          f.container === 'mp4' &&
          f.hasAudio === true &&
          f.hasVideo === true
        ) ||
        formats.find(f => f.qualityLabel === '360p' && f.container === 'mp4' && f.hasAudio && f.hasVideo) ||
        formats.find(f => f.qualityLabel === '720p' && f.container === 'mp4' && f.hasAudio && f.hasVideo);

      if (!chosenFormat) {
        return res.status(400).json({ error: 'No suitable video format available with audio' });
      }

      res.setHeader('Content-Disposition', 'attachment; filename="default.mp4"');
      ytdl(fullUrl, { format: chosenFormat }).pipe(res);
    }
  } catch (err) {
    console.error('Error retrieving video information:', err);
    res.status(500).json({ error: 'Failed to retrieve video details' });
  }
});


app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});