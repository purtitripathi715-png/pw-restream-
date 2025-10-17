# PW Restream Demo (Educational)

**Purpose:** Demo showing how to start a server-side ffmpeg restream from a public HLS (.m3u8) source.

**Important:** DO NOT use for paywalled or DRM-protected content. Use only public streams you have rights to.

## Quick start
1. Copy `server/.env.example` to `server/.env` and tweak if needed.
2. Build & run with Docker Compose:
   ```bash
   docker-compose up -d --build
