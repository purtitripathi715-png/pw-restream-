import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 80;
const HLS_DIR = process.env.HLS_DIR || path.join(process.cwd(), 'hls');
const FFMPEG_TIMEOUT = parseInt(process.env.FFMPEG_TIMEOUT || '0', 10);

app.use(cors());
app.use(bodyParser.json());

// serve static web UI
app.use('/', express.static(path.join(process.cwd(), '..', 'web')));
// serve hls folder
app.use('/hls', express.static(HLS_DIR, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

let ffmpegProcess = null;
let currentSource = null;

app.post('/api/start', (req, res) => {
  const { source } = req.body;
  if (!source) return res.status(400).json({ error: 'source required' });
  if (ffmpegProcess) {
    return res.status(409).json({ error: 'already running', source: currentSource });
  }

  // start ffmpeg in background
  const script = path.join(process.cwd(), 'start_ffmpeg.sh');
  const args = [source, HLS_DIR];
  ffmpegProcess = spawn(script, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  currentSource = source;

  ffmpegProcess.stdout.on('data', (d) => console.log('[ffmpeg]', d.toString()));
  ffmpegProcess.stderr.on('data', (d) => console.log('[ffmpeg]', d.toString()));
  ffmpegProcess.on('exit', (code, sig) => {
    console.log('ffmpeg exited', code, sig);
    ffmpegProcess = null;
    currentSource = null;
  });

  // optional timeout kill
  if (FFMPEG_TIMEOUT > 0) {
    setTimeout(() => {
      if (ffmpegProcess) {
        ffmpegProcess.kill('SIGTERM');
      }
    }, FFMPEG_TIMEOUT * 1000);
  }

  // return HLS URL
  const hlsUrl = `${getBaseUrl(req)}/hls/stream.m3u8`;
  return res.json({ ok: true, hls: hlsUrl });
});

app.post('/api/stop', (req, res) => {
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGTERM');
    ffmpegProcess = null;
    currentSource = null;
    return res.json({ ok: true });
  }
  return res.json({ ok: false, error: 'not running' });
});

app.get('/api/status', (req, res) => {
  return res.json({ running: !!ffmpegProcess, source: currentSource });
});

function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  if (!fs.existsSync(HLS_DIR)) fs.mkdirSync(HLS_DIR, { recursive: true });
});
