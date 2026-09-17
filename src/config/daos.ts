export interface DaoConfig {
  /** Unique slug used in URLs and storage keys. */
  slug: string;
  name: string;
  /** Snapshot space id, e.g. "shutterdao0x36.eth". */
  snapshotSpace: string;
  /** Governance token symbol. */
  tokenSymbol: string;
  links: {
    forum?: string;
    onchainGovernance?: string;
    website?: string;
    docs?: string;
  };
  treasury: {
    label: string;
    address: string;
    chain: string;
    explorerUrl: string;
  }[];
}

/**
 * Gov-Hub is multi-tenant by design: onboarding a DAO is adding an entry here
 * (later: a hosted config). Shutter DAO 0x36 is the flagship tenant.
 */
export const DAOS: DaoConfig[] = [
  {
    slug: "shutter-dao-0x36",
    name: "Shutter DAO 0x36",
    snapshotSpace: "shutterdao0x36.eth",
    tokenSymbol: "SHU",
    links: {
      forum: "https://shutternetwork.discourse.group",
      onchainGovernance:
        "https://app.decentdao.org/home?dao=eth:0x36bD3044ab68f600f6d3e081056F34f2a58432c4",
      website: "https://www.shutter.network/shutter-dao",
      docs: "https://docs.shutter.network/docs/dao/0x36",
    },
    treasury: [
      {
        label: "SHU token (ERC-20)",
        address: "0xe485E2f1bab389C08721B291f6b59780feC83Fd7",
        chain: "Ethereum",
        explorerUrl:
          "https://etherscan.io/token/0xe485E2f1bab389C08721B291f6b59780feC83Fd7",
      },
    ],
  },
];

export const DEFAULT_DAO = DAOS[0];
