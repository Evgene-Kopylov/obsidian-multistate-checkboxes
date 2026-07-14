# AGENTS.md

## Overview

`obsidian-multistate-checkboxes` — extended checkbox states for Obsidian, theme-independent. SVG icons are embedded via `data:image/svg+xml`, colors use Obsidian CSS variables for automatic adaptation to any theme.

## Quick start

```sh
# Clone into .obsidian/plugins/obsidian-multistate-checkboxes/
git clone <repo> /path/to/vault/.obsidian/plugins/obsidian-multistate-checkboxes

# Install dependencies
npm install

# Dev build (watch)
npm run dev

# Production build
npm run build
```

Reload plugins via **Ctrl+P → Reload plugin** or restart Obsidian.

## Project structure

```
obsidian-multistate-checkboxes/
├── src/
│   ├── main.ts           # Plugin entry point, lifecycle management
│   ├── types.ts          # Interfaces (CheckboxState, StateSettings, ...)
│   ├── states.ts         # ALL_STATES, STATE_MAP, default settings
│   ├── css.ts            # generateCSS — CSS generation from settings
│   ├── settings.ts       # SettingTab — settings UI, drag-and-drop
│   └── commands/
│       └── cycle.ts      # Cycle commands, hotkeys
├── manifest.json         # Plugin metadata (Obsidian)
├── styles.css            # Default styles
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── esbuild.config.mjs    # esbuild bundler
├── versions.json         # Obsidian version → minAppVersion map
├── AGENTS.md             # This file
├── README.md             # User documentation
└── LICENSE               # GPL-3.0
```

## Tech stack

- **TypeScript** — development language
- **esbuild** — bundler
- **Obsidian API** — `Plugin`, `PluginSettingTab`, `Setting`, `Editor`, `MarkdownView`
- **CSS** — via `styles.css` (auto-loaded by Obsidian) and dynamic `<style>` element

## Key Obsidian API concepts

### Plugin lifecycle

```ts
export default class MyPlugin extends Plugin {
  async onload() {
    // Register commands, events, CSS
  }
  onunload() {
    // Clean up resources
  }
}
```

### Checkboxes in Obsidian

- **Reading view**: `<li data-task="x" class="task-list-item is-checked">`
- **Live Preview**: `<div class="HyperMD-task-line" data-task="x">`

CSS selectors must handle both cases.

### Settings

```ts
class SettingTab extends PluginSettingTab {
  display() {
    new Setting(containerEl)
      .setName("Setting name")
      .addToggle(toggle => toggle.setValue(true))
  }
}
```

## Commands & settings

- Commands are registered via `this.addCommand(...)` or `plugin.addCommand(...)` in `src/commands/cycle.ts`.
- Settings tab is in `src/settings.ts`.
- Settings are persisted using `this.loadData()` / `this.saveData()`.
- Command IDs: `cycle-checkbox-state` (forward), `cycle-checkbox-state-backward` (backward). Do not rename.
- Hotkeys: `Alt+Q` (forward), `Alt+Shift+Q` (backward), bound by physical key code (`KeyQ`) for any keyboard layout.

## File & folder conventions

- Source lives in `src/`. Keep `main.ts` small and focused on plugin lifecycle.
- Do not commit build artifacts: `node_modules/`, `main.js` are in `.gitignore`.
- Release artifacts at root: `main.js`, `manifest.json`, `styles.css`.

## Coding conventions

- Code and comments: Russian
- UI (settings, command names, state names): English
- Documentation (README): English
- Commit messages: Conventional Commits, Russian, imperative mood
- CSS variables from Obsidian (`--text-faint`, `--interactive-accent`, etc.) instead of hardcoded colors
- SVG in CSS: `data:image/svg+xml,...` (URL-encoded)

## Security & compliance

- Fully offline — no network requests.
- No telemetry, no external services.
- Reads/writes only inside the vault.
- All DOM listeners registered via `this.registerDomEvent` or `this.registerEvent` for safe cleanup.

## Testing

Manual install for testing: copy `main.js`, `manifest.json`, `styles.css` to:

```
<Vault>/.obsidian/plugins/obsidian-multistate-checkboxes/
```

Reload Obsidian and enable in **Settings → Community plugins**.

## Versioning & releases

- Bump `version` in `manifest.json` (SemVer).
- Update `versions.json` to map plugin version → minimum Obsidian version.
- GitHub release tag must match `manifest.json` version exactly (no leading `v`).

## Troubleshooting

- Plugin doesn't load: ensure `main.js`, `manifest.json`, `styles.css` are at the plugin folder root.
- Build issues: run `npm run build` to recompile.
- Commands not appearing: verify `addCommand` runs during `onload` and IDs are unique.
- Settings not persisting: ensure `loadData`/`saveData` are awaited.

## References

- Obsidian sample plugin: https://github.com/obsidianmd/obsidian-sample-plugin
- API documentation: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
