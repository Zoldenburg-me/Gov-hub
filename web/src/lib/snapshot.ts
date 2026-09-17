/**
 * Thin client for the Snapshot GraphQL hub (https://hub.snapshot.org/graphql).
 * Snapshot is where Shutter DAO 0x36 (and 600+ other DAOs) run shielded voting
 * powered by Shutter threshold encryption.
 */

const SNAPSHOT_HUB = "https://hub.snapshot.org/graphql";

export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  state: "pending" | "active" | "closed";
  author: string;
  link: string;
  /** "shutter" when the proposal uses Shutter shielded voting. */
  privacy: string;
  scores: number[];
  scores_total: number;
  votes: number;
  quorum: number;
}

export interface SnapshotSpace {
  id: string;
  name: string;
  about: string;
  members: string[];
  followersCount: number;
  proposalsCount: number;
  voting: { privacy?: string; period?: number; quorum?: number };
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(SNAPSHOT_HUB, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Snapshot hub error: HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Snapshot hub: ${json.errors[0].message}`);
  return json.data as T;
}

export async function fetchSpace(space: string): Promise<SnapshotSpace> {
  const data = await gql<{ space: SnapshotSpace }>(
    `query Space($id: String!) {
      space(id: $id) {
        id name about followersCount proposalsCount
        voting { privacy period quorum }
      }
    }`,
    { id: space },
  );
  return data.space;
}

export async function fetchProposals(
  space: string,
  limit = 20,
): Promise<SnapshotProposal[]> {
  const data = await gql<{ proposals: SnapshotProposal[] }>(
    `query Proposals($space: String!, $first: Int!) {
      proposals(
        first: $first
        skip: 0
        where: { space_in: [$space] }
        orderBy: "created"
        orderDirection: desc
      ) {
        id title body choices start end state author link privacy
        scores scores_total votes quorum
      }
    }`,
    { space, first: limit },
  );
  return data.proposals;
}
