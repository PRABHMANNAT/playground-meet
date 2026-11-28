import { Header } from '@/components/header';
export default function Privacy() {
  return (
    <>
      <Header />
      <main id="main" className="document">
        <span className="eyebrow">YOUR SPACE. YOUR INFORMATION.</span>
        <h1>Privacy, in plain language.</h1>
        <p>
          Playground Meet stores your display name, room memberships, messages, chat attachments,
          shared notes, drawings, polls, feedback and meeting timestamps on the operator’s server.
          Account email addresses and salted password hashes are stored if you create an account. A
          strictly necessary HttpOnly session cookie signs you in for seven days.
        </p>
        <h2>Your camera stays yours.</h2>
        <p>
          Camera and microphone access starts only when you enable them. Audio and video travel
          through the configured LiveKit server using encrypted WebRTC transport. When you turn on
          transcription, your browser converts your own microphone audio into text. The room stores
          and shares the speaker name, caption and timestamp. The media server handles transport
          encryption and is part of the trust boundary.
        </p>
        <h2>Local meeting recordings</h2>
        <p>
          A participant can confirm recording and choose the meeting tab in their browser. Everyone
          in the room can see who is recording. The recorder’s browser saves the visible tab and
          meeting audio on that device. The meeting server receives recording status only. The
          recorder can download or delete their browser copy from the meeting recap.
        </p>
        <h2>Shared means shared.</h2>
        <p>
          Admitted participants can access shared collaboration content and download meeting
          summaries. A private note stays in the current tab. Sharing puts its text on the stage.
          Withdrawing a live note removes it from the stage and future recaps. Participants may
          already have copied or recorded it. Chat messages, files, stickers and map pins addressed
          to one participant are available to the sender and that recipient. The meeting server
          stores them. Sharing your current location requires browser permission and a separate send
          action. Hosts control admission and can remove participants. People who already downloaded
          a file or summary retain their copy. Avoid adding confidential information unless everyone
          in the room is authorized to see it.
        </p>
        <h2>No paid AI. No ad trackers.</h2>
        <p>
          Summaries are assembled from your contributions. The application does not send your notes
          to an AI API or include advertising analytics. A configured hosting or LiveKit provider
          may keep operational logs under its own policies.
        </p>
        <h2>Retention and requests.</h2>
        <p>
          The included maintenance command deletes ended meetings older than 30 days when the
          operator schedules it. It is not automatic until configured. Contact your Playground
          operator for access or deletion requests and their actual retention policy. Guests lose
          access when their session expires unless they create an account first.
        </p>
        <p>
          <a href="https://tryplayground.net/privacy">Playground privacy information</a>
        </p>
      </main>
    </>
  );
}
