import { useEffect, useState } from "react";
import { DEFAULT_DAO } from "./config/daos";
import { fetchProposals, fetchSpace, type SnapshotProposal, type SnapshotSpace } from "./lib/snapshot";
import { ProposalCard } from "./components/ProposalCard";
import { SealedPositions } from "./components/SealedPositions";

type Tab = "proposals" | "sealed";

export default function App() {
  const dao = DEFAULT_DAO;
  const [tab, setTab] = useState<Tab>("proposals");
  const [proposals, setProposals] = useState<SnapshotProposal[] | null>(null);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProposals(dao.snapshotSpace), fetchSpace(dao.snapshotSpace)])
      .then(([p, s]) => {
        if (cancelled) return;
        setProposals(p);
        setSpace(s);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [dao.snapshotSpace]);

  const shieldedCount = proposals?.filter((p) => p.privacy === "shutter").length ?? 0;

  return (
    <div className="shell">
      <header>
        <div>
          <h1>Gov-Hub</h1>
          <p className="muted">
            One pane of glass for <strong>{dao.name}</strong> governance — forum, Snapshot
            and on-chain votes — with commitments sealed by Shutter threshold encryption.
          </p>
        </div>
        <nav>
          <button className={tab === "proposals" ? "active" : ""} onClick={() => setTab("proposals")}>
            Proposals
          </button>
          <button className={tab === "sealed" ? "active" : ""} onClick={() => setTab("sealed")}>
            Sealed Positions
          </button>
        </nav>
      </header>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{space?.proposalsCount ?? "—"}</span>
          <span className="muted">proposals all-time</span>
        </div>
        <div className="stat">
          <span className="stat-value">{space?.followersCount ?? "—"}</span>
          <span className="muted">members on Snapshot</span>
        </div>
        <div className="stat">
          <span className="stat-value">{proposals ? shieldedCount : "—"}</span>
          <span className="muted">shielded of last {proposals?.length ?? "…"}</span>
        </div>
      </div>

      <div className="links">
        {dao.links.forum && (
          <a href={dao.links.forum} target="_blank" rel="noreferrer">Forum ↗</a>
        )}
        <a href={`https://snapshot.org/#/${dao.snapshotSpace}`} target="_blank" rel="noreferrer">
          Snapshot ↗
        </a>
        {dao.links.onchainGovernance && (
          <a href={dao.links.onchainGovernance} target="_blank" rel="noreferrer">
            On-chain (Decent) ↗
          </a>
        )}
        {dao.treasury.map((t) => (
          <a key={t.address} href={t.explorerUrl} target="_blank" rel="noreferrer">
            {t.label} ↗
          </a>
        ))}
      </div>

      {tab === "proposals" ? (
        <section className="proposal-list">
          {error && (
            <p className="error">
              Could not reach the Snapshot hub: {error}
            </p>
          )}
          {!error && proposals === null && <p className="muted">Loading proposals…</p>}
          {proposals?.map((p) => <ProposalCard key={p.id} proposal={p} />)}
        </section>
      ) : (
        <SealedPositions />
      )}

      <footer className="muted">
        Built on the{" "}
        <a href="https://www.shutter.network" target="_blank" rel="noreferrer">
          Shutter Network
        </a>{" "}
        Keyper network · not affiliated with Shutter DAO 0x36 (yet).
      </footer>
    </div>
  );
}
