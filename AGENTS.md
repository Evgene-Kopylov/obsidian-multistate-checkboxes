# AGENTS.md

## Overview

`obsidian-multistate-checkboxes` — extended checkbox states for Obsidian, theme-independent. SVG icons are embedded via `data:image/svg+xml`, colors use Obsidian CSS variables for automatic adaptation to any theme.


## Процесс работы с задачами

Задачи — `docs/tasks/`, по файлу на задачу. Перед изменениями читать `docs/tasks/index.md`.

Порядок:

1. Взять свободную из `index.md`: `[ ]` → `[>]`
2. Выполнить (код, тесты)
3. Коммит → уведомить пользователя
4. Дождаться принятия коммита
5. Отметить `[x]`
6. Взять следующую
7. Если свободных нет — обновить `index.md` из `docs/tasks/`

## 🚫 Запрещённые файлы (никогда не читать)

- `node_modules/` — npm зависимости, большой объём
- `main.js` — сгенерированный бандл (очень большой, длинные строки)
- любые другие сгенерированные файлы

## Общие правила

- Неиспользуемые методы удалять без сожаления.
- Избегать равноправных вариантов → один способ делать что-либо.
- Без миграций данных.
- до версии 1.0.0 обратная совместимость означает отображать ошибку с причиной и вариантом решения, если что-то перестало работать.
- **Запрет хардкода цветов.** Никаких `#e53935`, `#999` в TS или CSS. Цвета — только через CSS-переменные (`var(--text-faint)`, `var(--background-modifier-border)`) или настройки плагина.
- **Переиспользование существующего.** Прежде чем создать константу/функцию — проверить, нет ли уже нужного в существующих модулях.

## File editing rules (Zed + DeepSeek)

CRITICAL: When using `edit_file` tool:

- NEVER rewrite entire file. Do targeted SEARCH and REPLACE only.
- `old_text` must include 3-5 lines of surrounding code to ensure uniqueness.
- `new_text` identical to `old_text` except the exact change.
- No markdown code blocks, no extra text inside `new_text`.
- Multiple unrelated changes → separate `edit_file` calls.
- **`edits` передавать как JSON-строку, не как массив.** Иначе VecOrJsonString. Формат: `"edits": "[{\"old_text\": \"...\", \"new_text\": \"...\"}]"`

Example:

Task: change `const port = 3000;` to `const port = 8080;`

✅ Correct `old_text`:

```javascript
const express = require('express');
const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
```

✅ Correct `new_text`:

```javascript
const express = require('express');
const app = express();
const port = 8080;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
```

❌ Wrong: replacing whole file content.

Если edit_file или любая файловая операция завершается с ошибкой доступа, блокировки или похожей:

1. Сохранить файл и повторить
2. Не вышло — жди и пробуй (2с → 4с → 8с). После каждой попытки: «Файл выглядит заблокированным, повторяю через N секунд…»
3. Не вышло — выведи:

```text
ОШИБКА: Не удаётся получить доступ к <файл> после нескольких попыток.
Вероятно он заблокирован другим процессом.
Я прекращаю работу и жду разрешения ситуации.
```

### Несохранённые изменения в файлах

Unsaved changes → `save_file` → продолжай. Без спроса.

## 🔥 Строгое отношение к неиспользуемому коду

- Запрещён код «для обратной совместимости».
- Запрещён код «на всякий случай».
- Запрещены закомментированные неиспользуемые блоки.
- Запрещены неиспользуемые переменные, функции, импорты, экспорты, методы класса.
- Любой невыполняемый код удалить.
- Перед коммитом проверять мёртвый код (ESLint `no-unused-vars`, TS `noUnusedLocals`/`noUnusedParameters`).
- Временно не нужная функциональность → удалить (не комментировать). Восстановить из git.

## Запуск shell-команд

- Оболочка `/bin/sh` (не bash).
- **Heredoc запрещён.** Не использовать `<< 'PYEOF'` и подобное.
- **Не использовать подстановки** (`$VAR`, `${VAR}`, `$(...)`, backticks, `<(...)`, `>(...)`).
- Для Python использовать **однострочный вызов**: `python3 -c '...'` (одинарные кавычки, без переносов).
- Для длинного Python-кода сначала записать скрипт в файл, затем вызвать `python3 script.py`.
- Избегать символа `!` в командах.


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
