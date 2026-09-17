/**
 * Minimal Snapshot hub client for the governance digest: the Signal Handler
 * fetches fresh proposal state here and hands it to the agent inside the
 * Prompt, so the agent needs no network access of its own.
 */

const SNAPSHOT_HUB = "https://hub.snapshot.org/graphql";

export type ProposalDigestEntry = {
  id: string;
  title: string;
  state: string;
  privacy: string;
  end: number;
  votes: number;
  scores_total: number;
  quorum: number;
  link: string;
};

export async function fetchProposalsForDigest(
  space: string,
  limit = 10,
): Promise<ProposalDigestEntry[]> {
  const res = await fetch(SNAPSHOT_HUB, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query Proposals($space: String!, $first: Int!) {
        proposals(
          first: $first
          skip: 0
          where: { space_in: [$space] }
          orderBy: "created"
          orderDirection: desc
        ) { id title state privacy end votes scores_total quorum link }
      }`,
      variables: { space, first: limit },
    }),
  });
  if (!res.ok) throw new Error(`Snapshot hub error: HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: { proposals: ProposalDigestEntry[] };
    errors?: { message: string }[];
  };
  if (json.errors?.length) throw new Error(`Snapshot hub: ${json.errors[0]!.message}`);
  return json.data?.proposals ?? [];
}
