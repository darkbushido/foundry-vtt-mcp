# Fork notes: Shadowrun 3e (The2ndChumming3e) support

Fork of `adambdooley/foundry-vtt-mcp` (`upstream`), kept at `darkbushido/foundry-vtt-mcp` (`origin`).
It adds support for the `The2ndChumming3e` Foundry system (Shadowrun 3rd Edition), so one
`get-character` call returns a full PC sheet.

## What changed

All changes are in the MCP server (`packages/mcp-server`). **The Foundry module is unchanged.**
The module already sends each item's full `system` data. The server's `formatItems` was
dropping those fields.

| File                      | Change                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/systems/sr3e/` (new) | `SR3EAdapter`, constants, tests                                                                |
| `src/systems/types.ts`    | `'The2ndChumming3e'` added to `SystemId`; new optional adapter hook `formatItemDetails?(item)` |
| `src/tools/character.ts`  | `formatItems` merges `adapter.formatItemDetails(item)` into each item (about 10 lines)         |
| `src/backend.ts`          | 2 lines to register `SR3EAdapter`                                                              |

`get-character` on an SR3 actor now returns:

- **`stats`**: attributes (value/base/mod; essence value/base/lost; magic; reaction), initiative
  (`derived.initiative` + dice), dice pools with total/available (combat, spell, astral,
  initiate, hacking, control, karma; read from `system.derived`, empty pools left out),
  condition monitor (physical/stun/overflow), resources (nuyen, karma, totalKarma,
  karmaPool, karmaPoolSpent, rep/street cred/notoriety, professional rating), magic
  (tradition/type/totem/element, initiate grade, sustained spells), summed worn armour, and a
  sorted skill list with rating, attribute and specialisations. Vehicles get their own block.
- **`items[]`**: each item carries its rule fields inline (see `SR3E_ITEM_FIELDS` in
  `constants.ts`). Examples: skill rating/specialisations; weapon damage/conceal/mode/ammo/
  loaded rounds; armour ballistic/impact; cyberware essenceCost/grade/rating; spell
  force/drain/type/range. Empty values are left out. Descriptions and notes are not included.

### Not done

- **Creature index / filters (phase 3).** The module builds indexes from hardcoded
  per-system branches in `foundry-module/src/data-access.ts` (`buildEnhancedIndex`). Adding SR3
  there would be a module change. The "not implemented for system" log line is harmless.
- **Worn armour per item.** Worn state lives in item _flags_, which the module doesn't send.
  `stats.armor` uses the system's derived `armorSumBallistic/Impact` instead.
- **Skill dice pools.** `dicePool` is derived on the item and isn't in `toObject()`, so only
  `rating` comes through.

## Rebasing on upstream

```powershell
git fetch upstream
git rebase upstream/master
```

Conflicts can only show up in the three small edits above (`types.ts` SystemId union and
interface, `character.ts` `formatItems`, `backend.ts` registry). Then run
`npm ci; npm run build; npm -w @foundry-mcp/server test`.

## Installing

The Windows installer runs single-file bundles, so only three files change. Install the
matching upstream release with its installer first (same version as this fork), then:

1. Build: `npm ci; npm run build`, then `npm -w @foundry-mcp/server run build:bundle`.
2. Stop the server: quit Claude, or stop the `node.exe` processes whose command line contains
   `FoundryMCPServer` (otherwise the files are locked).
3. Back up, then copy into
   `%LOCALAPPDATA%\FoundryMCPServer\foundry-mcp-server\packages\mcp-server\dist\`:
   - `dist\backend.bundle.cjs` → `backend.bundle.cjs`
   - `dist\index.bundle.cjs` → `index.bundle.cjs` **and** `index.cjs` (the launcher Claude runs)
4. Restart Claude. To roll back, copy the backed-up files back.

Re-running the upstream installer overwrites these files, so repeat the steps after each upgrade.

### Foundry module (production)

The fork's code doesn't change the module, but `module.json` on `sr3e` points `url`,
`manifest` and `download` at **this fork's releases**
(`https://github.com/darkbushido/foundry-vtt-mcp/releases/latest/download/module.json`),
so Foundry installs and updates the module from here.

- The manifest only works once the fork has a published release. The built module
  (`dist/main.js`) isn't in git, so a branch URL can't be installed.
- GitHub disables Actions on forks by default: enable them once under the fork's
  **Settings → Actions → General**.
- To publish: push a new `v*` tag from `sr3e` (`git tag -a v0.8.6-sr3e.3 -m ...; git push origin v0.8.6-sr3e.3`).
  Don't start the workflow by hand from the Actions tab: a manual run builds whatever branch it's
  started from (`master` by default) and never creates a release.
- The fork's workflow names the Mac pkg/DMG from the tag (`VERSION=` on the two Mac build steps).
  Upstream names them from `package.json`, which breaks on suffixed tags. The `create-release` job
  also declares `permissions: contents: write`, since a fork's default token is read-only. Its release-note
  and registry links use `${{ github.repository }}` instead of upstream's URL. Keep all three on a
  rebase.
  The tag triggers `.github/workflows/build-complete-release.yml` on the fork, which attaches
  `module.json` and `foundry-vtt-mcp.zip`. Its last step, "Update Foundry VTT Package Registry",
  fails on the fork (no upstream secret). That's expected, and it runs after the release exists.
- Foundry only offers an update when `version` in `module.json` is newer than the installed
  one. Bump it for each fork release.
- On a rebase, keep the fork's three URLs if upstream's `module.json` conflicts.

## Notes for consumers

- **sr3e-storyline `pc_sheet`** (`tools/muse_server.py`): one `get-character` call is enough.
  Read `stats.attributes`, `stats.dicePools`, `stats.conditionMonitor`, `stats.resources`,
  `stats.skills` and the inline item fields, and drop the per-item `get-character-entity`
  loop. Pool keys are `combat|spell|astral|initiate|hacking|control|karma`, each `{total, available}`.
- **The2ndChumming3e system**: nothing needed. If skill dice pools or worn state should come
  through, they would have to be stored in item `system` (not only derived/flags), or the
  module would need to send `flags` too.
