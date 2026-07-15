# Multistate Checkboxes

Extended checkbox states for Obsidian, theme-independent. SVG icons are embedded via `data:image/svg+xml`, colors use Obsidian CSS variables for automatic adaptation to any theme.

## Features

- **20 checkbox states** with unique SVG icons
- **Theme-independent** — all colors via Obsidian CSS variables
- **Flexible configuration** — enable/disable states, custom colors and icons
- **Cycling** — command to rotate through states in order
- Supports **Reading view** and **Live Preview**

## Default States

| Symbol | Purpose |
|--------|---------|
| `x`/`X` | Done |
| `-` | Cancelled |
| `>` | Deferred |
| `<` | Scheduled |
| `?` | Question |
| `/` | In progress |
| `!` | Important |
| `*` | Priority |
| `"` | Quote |
| `l` | Location |
| `i` | Info |
| `I` | Idea |
| `f` | Fire |
| `k` | Key |
| `u` | Up |
| `d` | Down |
| `w` | Win |
| `p` | Pro |
| `c` | Con |
| `b` | Bookmark |

## Installation

### Manual

1. Download the latest release from [Releases](https://github.com/Evgene-Kopylov/obsidian-multistate-checkboxes/releases)
2. Extract to `.obsidian/plugins/obsidian-multistate-checkboxes/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

### From source

```sh
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/Evgene-Kopylov/obsidian-multistate-checkboxes.git
cd obsidian-multistate-checkboxes
npm install
npm run build
```

## Usage

### Creating a checkbox with a state

In a Markdown task, use the corresponding symbol inside the brackets:

```markdown
- [x] Completed task
- [-] Cancelled task
- [>] Deferred task
- [!] Important task
- [?] Question
- [/] In progress
```

### Cycling

1. Place the cursor on a checkbox line
2. Run the command `Multistate Checkboxes: Cycle checkbox state`
3. The state will change to the next one in order

The cycle order can be configured in Settings → Multistate Checkboxes.

### Settings

In Settings → Multistate Checkboxes you can:

- Enable/disable any state
- Override icon color (hex, rgb(), CSS variable)
- Replace the SVG icon with your own
- Configure the cycling order

## Development

```sh
npm install        # install dependencies
npm run dev        # watch mode build
npm run build      # production build
```

```sh
# Install the plugin in a vault
# Symlink the current folder (with the build output) into the vault's plugins
ln -s "$PWD" "/home/death/obsidian-vault/.obsidian/plugins/multistate-checkboxes"
```

## License

GPL-3.0 — see [LICENSE](LICENSE)
