# Playground Meet

Start a video call from your browser, invite people with a link, and keep the discussion and feedback in one place. Playground Meet pairs LiveKit calls with a shared browser, notes, a whiteboard, and an exportable meeting recap.

[**Open Playground Meet**](https://playground-meet.vercel.app/) · [Run locally](#run-locally) · [Deploy on Vercel](docs/VERCEL.md) · [MIT license](LICENSE)

![Playground Meet homepage with controls to start or join a meeting and a recent meetings panel](docs/assets/home.jpg)

## What you can do

| Feature                  | What it does                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Start or join a call** | Create a meeting as a guest, share its invite link, and check your camera and microphone before joining. Sign in to keep meeting history across devices.                                           |
| **Run the meeting**      | Admit guests from the waiting room, lock the room, moderate participants, or end the call for everyone. Share your screen and pin a participant in your own view.                                  |
| **Browse together**      | Open up to five tabs, search Wikipedia, and share one HTTPS page at a time. Participants can draw on the shared preview. Use screen sharing for sites that block embeds or to show live scrolling. |
| **Work together**        | Use chat, reactions, raised hands, shared notes, a whiteboard, polls, action items with owners and due dates, a decision log, and a product review brief.                                          |
| **Follow up**            | Review notes and timestamped feedback, rate the meeting, and download a Markdown summary.                                                                                                          |

### Share a web page during a call

Open **Tools → Shared browser**, enter a public HTTPS address, and select **Share page**. Participants can click **Shared page** above the video gallery to open the room’s current link and follow new links as they are shared. Everyone can annotate an embeddable shared page. Each personal tab has its own Back, Forward, and Reload controls, including for Wikipedia searches.

To present clicks, scrolling, or a site that blocks previews, choose **Open in tab**, return to the meeting, and select **Present a browser tab**. Choose the site in the browser’s sharing picker. **Stop live presentation** ends the video share.

### Blur your camera background

During a call, turn on your camera and open **Device settings → Background blur**. The preview shows the same effect other participants receive. Blur stays on when you hide the preview or turn your camera off and back on. Switch it off to share the original picture again.

The browser downloads the model from Playground Meet and processes camera frames on your device. This requires WebGL 2 and a compatible browser video pipeline. No API key or paid processing service is required.

### Record a meeting locally

Select **Record** before **Tools** in the call toolbar. Confirm, then choose the meeting tab in the browser picker. The recording follows what is visible in that tab, including cameras, screen shares, the whiteboard and open panels. Enable tab audio in the picker to include playback from chat videos and embedded pages. Meeting voices are included with either audio choice.

Participants, including anyone joining late, see who is recording. **Stop and save recording** downloads a video. Leaving or disconnecting also stops capture. The recap’s **Local recordings** section lets you download another copy or delete the browser copy on the same device and browser profile. Desktop Chrome and Edge support the tab picker. Available recording time depends on free browser storage.

### Live transcription and meeting notes

Open **Transcript** in the meeting and select **Include my microphone**. Each speaker opts in separately. Whisper Base English processes short phrases on the participant’s device and sends captions to the room with the speaker’s name and timestamp. Muting pauses microphone capture. Select **Lite** before starting to use Vosk on slower devices.

In a local Chromium test, the meeting phrase splitter and Whisper worker scored **3.98% word error rate** (33 word edits over 829 reference words). The test used the first clip for each of 40 speakers in the [LibriSpeech clean validation split](https://huggingface.co/datasets/openslr/librispeech_asr/tree/71cacbfb7e2354c4226d01e70d77d5fca3d04ba1/clean/validation), totaling 5 minutes 12 seconds of read English. The score ignores capitalization and punctuation except apostrophes. Accuracy in noisy or overlapping conversations can differ.

In **Transcript → Caption language for me**, each viewer can translate finalized English captions into Spanish, French, German, Hindi, Portuguese, or Simplified Chinese. The transcript panel shows the original alongside the translation. Close the panel to see new translated captions over the call. To turn translation off, select **English (original)**. The meeting transcript and exports keep the original English text.

The first dev start or build downloads and verifies the Whisper assets (about 97 MiB) and the six OPUS-MT language packs (about 665 MiB combined). The app serves these locally. Participants load only the recognition or translation packs they select. The first translation in a language loads a pack of about 107–114 MiB plus the shared runtime. No speech or translation API key is required.

After the meeting, open **Meeting recap → Meeting transcript** and choose **Download TXT** or **Download PDF** for the full speaker transcript. While other participants finish transcribing their last phrase, the recap shows a short finalization status.

Leaving a meeting downloads a Markdown summary of the discussion so far. Ending it for everyone downloads the final notes for connected participants. Notes include spoken highlights, a timestamped transcript, shared notes, decisions and action items. The recap also has a manual download button.

Invites and recaps use the branded `/playground-meet/` route. Existing `/room/` links redirect to the same meeting.

## A look inside

These screenshots show the current local build with example meeting data.

| Device check                                                                                         | In-call tools                                                         |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ![Camera and microphone preview with device selectors and an invite button](docs/assets/prejoin.jpg) | ![Tools menu inside a LiveKit meeting](docs/assets/meeting-tools.jpg) |

| Shared browser                                                                                        | Meeting recap                                                                                      |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| ![Shared browser with two tabs and an annotation on the page preview](docs/assets/shared-browser.jpg) | ![Meeting recap with download controls, star rating, and optional feedback](docs/assets/recap.jpg) |

In a meeting, open **React → Browse stickers** to search the library, including 100 captioned photo stickers in **People & punchlines**, **City postcards** and **Meeting memes**. Choose **Edit pins** to save up to six favorites. Each browser starts with Jensen Huang, Elon Musk and a laughing terminal.

In **Chat**, choose **Everyone** or an admitted participant under **Send to**. Send text, pick a sticker, or share a named place or a device location. **Files** accepts multiple documents, presentations, images and other files up to 200 MB each. You can also drop files on the chat panel. Direct messages and their attachments are accessible only to the sender and recipient within the meeting. File contents are stored in the meeting database and removed with the room.

Open **Tools → Whiteboard** to draw on the meeting’s fullscreen canvas. Choose **Share to all** to present it alongside participant video. Admitted participants can draw together, see who is drawing, undo their own marks, and export the saved artwork as a landscape PDF. The presenter or host can stop presenting, and the host can clear the canvas.

## Run locally

Install Node.js 22 or later and a [local LiveKit server](https://docs.livekit.io/transport/self-hosting/local/).

```sh
git clone https://github.com/PRABHMANNAT/playground-meet.git
cd playground-meet
npm ci
cp .env.example .env.local
livekit-server --dev --bind 127.0.0.1
```

On Windows, use `Copy-Item .env.example .env.local` and run the LiveKit Windows executable. In a second terminal, start the app.

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000/). Local data persists in PGlite under `.data/meet`, so you can start without a hosted database. See the [local development guide](docs/LOCAL-DEVELOPMENT.md) for configuration and troubleshooting.

## Deploy and verify

- [Vercel](docs/VERCEL.md) connects the Next.js app to hosted PostgreSQL and LiveKit. You can use the assigned `vercel.app` domain.
- [Docker](docs/DEPLOYMENT.md) runs the stack on your own host with HTTPS and TURN.
- [Architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), and [Playground SSO](docs/INTEGRATION.md) cover the app and its integrations.

The app uses Next.js, TypeScript, and React. LiveKit carries media over WebRTC. PostgreSQL stores meeting state in production. Rooms support up to 25 identities.

```sh
npm run typecheck
npm test
npm run build

# With the app and LiveKit running locally
npm run test:links
npm run test:integration
npm run test:media
```

See the [testing guide](docs/TESTING.md) for coverage and test requirements.

## Contributing and license

Open a [GitHub issue](https://github.com/PRABHMANNAT/playground-meet/issues) with reproduction steps for bugs or a short description of the workflow you want to improve. See [SECURITY.md](docs/SECURITY.md) for the app's security model.

The project code is available under the [MIT License](LICENSE). Playground branding, bundled fonts, and other third-party assets retain their respective rights. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
