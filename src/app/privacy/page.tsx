import { Header } from '@/components/header';
export default function Privacy() {
  return (
    <>
      <Header />
      <main id="main" className="document">
        <span className="eyebrow">YOUR SPACE. YOUR INFORMATION.</span>
        <h1>Privacy, in plain language.</h1>
        <p>
          Playground Meet stores your display name, room memberships, messages, notes, drawings,
          polls, feedback and meeting timestamps on the operator’s server. Account email addresses
          and salted password hashes are stored if you create an account. A strictly necessary
          HttpOnly session cookie signs you in for seven days.
        </p>
        <h2>Your camera stays yours.</h2>
        <p>
          Camera and microphone access starts only when you enable them. Audio and video travel
          through the configured LiveKit server using encrypted WebRTC transport. Calls are not
          recorded or transcribed by this application. Transport encryption is not end-to-end
          encryption: the media-server operator is part of the trust boundary.
        </p>
        <h2>Shared means shared.</h2>
        <p>
          Admitted participants can access shared collaboration content and download meeting
          summaries. Hosts control admission and can remove participants. People who already
          downloaded a summary retain their copy. Avoid adding confidential information unless
          everyone in the room is authorized to see it.
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
