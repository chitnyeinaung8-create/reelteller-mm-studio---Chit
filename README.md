# ReelTeller MM AI Studio

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local` and add your Gemini API key.
3. Run `npm install` then `npm run dev`.

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Add `GEMINI_API_KEY` in Project Settings → Environment Variables.
4. Deploy.

## What V1 does
- Local video upload + preview (video is not uploaded by this app)
- Transcript / scene-notes input
- Gemini-powered original Myanmar recap generation
- Editable script
- Browser speech-synthesis voice preview when a Myanmar voice is available on the device
- TXT export

## Next production upgrades
- Automatic transcription using a dedicated speech-to-text service
- Server-side or desktop-grade FFmpeg rendering for long videos
- SRT generation and subtitle burn-in
- Dedicated Myanmar TTS provider and downloadable narration audio
- Timeline/scene selection and final MP4 render

Use only footage you own, license, or otherwise have permission to transform.
