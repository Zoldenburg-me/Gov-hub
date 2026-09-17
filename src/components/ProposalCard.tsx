import type { SnapshotProposal } from "../lib/snapshot";

function timeLeft(unixEnd: number): string {
  const secs = unixEnd - Math.floor(Date.now() / 1000);
  if (secs <= 0) return "ended";
  const days = Math.floor(secs / 86400);
  if (days > 0) return `${days}d ${Math.floor((secs % 86400) / 3600)}h left`;
  const hours = Math.floor(secs / 3600);
  if (hours > 0) return `${hours}h ${Math.floor((secs % 3600) / 60)}m left`;
  return `${Math.floor(secs / 60)}m left`;
}

export function ProposalCard({ proposal }: { proposal: SnapshotProposal }) {
  const shielded = proposal.privacy === "shutter";
  const active = proposal.state === "active";
  const quorumPct =
    proposal.quorum > 0
      ? Math.min(100, (proposal.scores_total / proposal.quorum) * 100)
      : null;
  const leading =
    !active && proposal.scores.length > 0
      ? proposal.choices[proposal.scores.indexOf(Math.max(...proposal.scores))]
      : null;

  return (
    <a className="card proposal" href={proposal.link} target="_blank" rel="noreferrer">
      <div className="proposal-top">
        <span className={`badge state-${proposal.state}`}>{proposal.state}</span>
        {shielded && (
          <span className="badge shielded" title="Votes are encrypted with Shutter threshold encryption until the proposal closes">
            shielded 🛡
          </span>
        )}
        <span className="muted">{active ? timeLeft(proposal.end) : new Date(proposal.end * 1000).toLocaleDateString()}</span>
      </div>
      <h3>{proposal.title}</h3>
      <div className="proposal-meta">
        <span>{proposal.votes} votes</span>
        {active && shielded ? (
          <span className="muted">tallies hidden until close</span>
        ) : leading ? (
          <span>
            leading: <strong>{leading}</strong>
          </span>
        ) : null}
      </div>
      {quorumPct !== null && (
        <div className="quorum">
          <div className="quorum-bar">
            <div className="quorum-fill" style={{ width: `${quorumPct}%` }} />
          </div>
          <span className="muted">{quorumPct.toFixed(0)}% of quorum</span>
        </div>
      )}
    </a>
  );
}
