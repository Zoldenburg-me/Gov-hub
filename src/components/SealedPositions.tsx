import { useEffect, useState } from "react";
import { seal, reveal, type SealedCommitment } from "../lib/shutter";
import { loadCommitments, saveCommitments } from "../lib/storage";

type Status = { kind: "idle" } | { kind: "busy"; msg: string } | { kind: "error"; msg: string };

/**
 * Sealed Positions: timelock-encrypted commitments powered by the Shutter API.
 * Write a position on a proposal now, pick a reveal time (e.g. when voting
 * closes), and share the ciphertext publicly. Nobody — including you — can
 * un-seal it early; anyone can verify and decrypt it after the reveal time.
 */
export function SealedPositions() {
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  const [revealAt, setRevealAt] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [items, setItems] = useState<SealedCommitment[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [importJson, setImportJson] = useState("");

  useEffect(() => {
    setItems(loadCommitments());
  }, []);

  const persist = (next: SealedCommitment[]) => {
    setItems(next);
    saveCommitments(next);
  };

  const onSeal = async () => {
    const ts = Math.floor(new Date(revealAt).getTime() / 1000);
    if (!text.trim()) return setStatus({ kind: "error", msg: "Write something to seal first." });
    if (!Number.isFinite(ts) || ts <= Date.now() / 1000 + 60) {
      return setStatus({ kind: "error", msg: "Pick a reveal time at least a minute in the future." });
    }
    setStatus({ kind: "busy", msg: "Registering identity with the Keyper network and encrypting…" });
    try {
      const commitment = await seal(text.trim(), ts, label.trim() || undefined);
      persist([commitment, ...items]);
      setText("");
      setLabel("");
      setStatus({ kind: "idle" });
    } catch (e) {
      setStatus({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  const onReveal = async (c: SealedCommitment) => {
    setStatus({ kind: "busy", msg: "Fetching decryption key…" });
    try {
      const plaintext = await reveal(c);
      setRevealed((r) => ({ ...r, [c.identity]: plaintext }));
      setStatus({ kind: "idle" });
    } catch (e) {
      setStatus({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  const onImport = () => {
    try {
      const parsed = JSON.parse(importJson) as SealedCommitment;
      if (!parsed.identity || !parsed.ciphertext || !parsed.decryptionTimestamp) {
        throw new Error("Not a valid sealed commitment.");
      }
      persist([parsed, ...items.filter((i) => i.identity !== parsed.identity)]);
      setImportJson("");
      setStatus({ kind: "idle" });
    } catch (e) {
      setStatus({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  const copy = (c: SealedCommitment) => {
    navigator.clipboard?.writeText(JSON.stringify(c, null, 2)).catch(() => {});
  };

  return (
    <section className="sealed">
      <div className="card">
        <h2>Sealed Positions</h2>
        <p className="muted">
          Commit to a position now, reveal it later — timelock encryption by the{" "}
          <a href="https://www.shutter.network/shutter-api" target="_blank" rel="noreferrer">
            Shutter Keyper network
          </a>
          . Post the sealed JSON to the forum as a tamper-evident pledge; anyone can
          decrypt it once the reveal time passes. Use it for sealed delegate positions,
          embargoed proposal drafts, or sealed-bid grant reviews.
        </p>
        <label className="field">
          <span>Position / note</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="e.g. I will vote FOR proposal #12 because…"
          />
        </label>
        <div className="row">
          <label className="field">
            <span>Label (optional)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Proposal #12 position"
            />
          </label>
          <label className="field">
            <span>Reveal at</span>
            <input
              type="datetime-local"
              value={revealAt}
              onChange={(e) => setRevealAt(e.target.value)}
            />
          </label>
        </div>
        <button onClick={onSeal} disabled={status.kind === "busy"}>
          {status.kind === "busy" ? status.msg : "Seal with Shutter"}
        </button>
        {status.kind === "error" && <p className="error">{status.msg}</p>}
      </div>

      <div className="card">
        <h3>Verify someone else's commitment</h3>
        <label className="field">
          <span>Paste sealed commitment JSON</span>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={3}
            placeholder='{"version":1,"identity":"0x…"}'
          />
        </label>
        <button onClick={onImport} disabled={!importJson.trim()}>
          Import
        </button>
      </div>

      {items.length > 0 && (
        <div className="commitments">
          <h3>Commitments</h3>
          {items.map((c) => {
            const due = Date.now() / 1000 >= c.decryptionTimestamp;
            const plain = revealed[c.identity];
            return (
              <div className="card commitment" key={c.identity}>
                <div className="commitment-top">
                  <strong>{c.label ?? "Sealed note"}</strong>
                  <span className={`badge ${due ? "state-closed" : "shielded"}`}>
                    {due ? "revealable" : "sealed"}
                  </span>
                </div>
                <p className="muted">
                  Reveals {new Date(c.decryptionTimestamp * 1000).toLocaleString()} ·
                  identity {c.identity.slice(0, 10)}…
                </p>
                {plain ? (
                  <blockquote>{plain}</blockquote>
                ) : (
                  <code className="cipher">{c.ciphertext.slice(0, 66)}…</code>
                )}
                <div className="row">
                  <button onClick={() => copy(c)}>Copy JSON</button>
                  {!plain && (
                    <button onClick={() => onReveal(c)} disabled={!due || status.kind === "busy"}>
                      Reveal
                    </button>
                  )}
                  <button
                    className="ghost"
                    onClick={() => persist(items.filter((i) => i.identity !== c.identity))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
