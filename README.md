# Gov-Hub

Governance tooling for DAOplomats.

## Skills

| Skill | What it does |
| --- | --- |
| [`dao-proposal-writer`](.claude/skills/dao-proposal-writer/) | Writes DAO governance proposals to the standard of pre-2023 forum proposals, in the target DAO's own template: Uniswap, ENS, Arbitrum, 1inch, Aave, Compound, Optimism, MakerDAO, Lido, Gitcoin. It drafts without AI padding: no restating, no self-verification, no leftovers from earlier drafts. It checks on-chain facts with `onchain-review` before writing, and offers a red-team pass with `governance-review`. |

### Using a skill

- **Claude Code:** clone this repo and open it in Claude Code. Skills in `.claude/skills/` load automatically.
- **claude.ai:** zip the skill's folder (for example `dao-proposal-writer/`) and upload it under Settings → Skills.

### Checking a draft by hand

```bash
python3 .claude/skills/dao-proposal-writer/scripts/slop_check.py draft.md --dao 1inch
```

The script exits with 0 when the draft is clean, 1 when it found errors, and 2 when the only remaining issues are open `[TBD]` placeholders.
