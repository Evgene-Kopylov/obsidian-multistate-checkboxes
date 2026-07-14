# AGENTS.md

## Обзор

Плагин `obsidian-multistate-checkboxes` — расширенные состояния чекбоксов для Obsidian, не зависящие от темы. SVG-иконки встроены через `data:image/svg+xml`, цвета используют CSS-переменные Obsidian для автоадаптации под любую тему.

## Быстрый старт

```sh
# Клонировать в .obsidian/plugins/obsidian-multistate-checkboxes/
git clone <repo> /path/to/vault/.obsidian/plugins/obsidian-multistate-checkboxes

# Установка зависимостей
npm install

# Сборка в режиме разработки (watch)
npm run dev

# Production-сборка
npm run build
```

Перезагрузи плагины через `Ctrl+P` → «Reload plugin» или перезапусти Obsidian.

## Структура проекта

```
obsidian-multistate-checkboxes/
├── src/
│   ├── main.ts           # точка входа, класс Plugin (жизненный цикл)
│   ├── types.ts          # интерфейсы (CheckboxState, StateSettings, ...)
│   ├── states.ts         # ALL_STATES, STATE_MAP, дефолтные настройки
│   ├── css.ts            # generateCSS — генерация CSS из настроек
│   ├── settings.ts       # SettingTab — UI настроек, drag-and-drop
│   └── commands/
│       └── cycle.ts      # команды циклического переключения, хоткеи
├── manifest.json        # метаданные плагина (Obsidian)
├── styles.css           # дефолтные стили
├── package.json         # зависимости и скрипты
├── tsconfig.json        # конфигурация TypeScript
├── esbuild.config.mjs   # сборщик esbuild
├── versions.json        # карта версий Obsidian → minAppVersion
├── AGENTS.md            # этот файл
├── README.md            # документация для пользователей
└── LICENSE              # GPL-3.0
```

## Технический стек

- **TypeScript** — язык разработки
- **esbuild** — сборка (быстрее webpack/rollup)
- **Obsidian API** — `Plugin`, `PluginSettingTab`, `Setting`, `MarkdownPostProcessor`
- **CSS** — через `styles.css` (автозагрузка Obsidian) и динамический `StyleSheet`

## Ключевые концепции Obsidian API

### Жизненный цикл плагина

```ts
export default class MyPlugin extends Plugin {
  async onload() {
    // Загрузка: регистрируй команды, события, CSS
  }
  onunload() {
    // Выгрузка: очищай ресурсы
  }
}
```

### Чекбоксы в Obsidian

- **Reading view**: `<li data-task="x" class="task-list-item is-checked">`
- **Live Preview**: `<div class="HyperMD-task-line" data-task="x">`

CSS-селекторы должны обрабатывать оба случая.

### Настройки

```ts
class SettingTab extends PluginSettingTab {
  display() {
    new Setting(containerEl)
      .setName("Название")
      .addToggle(toggle => toggle.setValue(true))
  }
}
```

## План реализации

1. Скаффолд — `main.ts`, `manifest.json`, билд-система
2. Перенос CSS из `_snipet_example.css` в `styles.css`
3. Settings tab — список стейтов с toggle вкл/выкл
4. Генерация CSS на лету через `StyleSheet` (условный импорт)
5. Команда Cycle — циклическое переключение стейта чекбокса
6. README — документация для пользователей

## Conventions

- Code and comments: Russian
- UI (settings, command names, state names): English
- Documentation (README): English
- Commit messages: Conventional Commits, Russian, imperative mood
- CSS variables from Obsidian (`--text-faint`, `--interactive-accent`, etc.) instead of hardcoded colors
- SVG in CSS: `data:image/svg+xml,...` (URL-encoded)
