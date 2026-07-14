import {
	Plugin,
	Editor,
	MarkdownView,
} from "obsidian";
import type { MultistateCheckboxesSettings } from "./types";
import {
	ALL_STATES,
	defaultStateSettings,
	makeDefaultSettings,
	DEFAULT_CYCLE_ORDER,
} from "./states";
import { generateCSS } from "./css";
import MultistateCheckboxesSettingTab from "./settings";

// ─── Основной класс плагина ─────────────────────────────────────────────────

export default class MultistateCheckboxesPlugin extends Plugin {
	settings: MultistateCheckboxesSettings;
	private dynamicStyle: HTMLStyleElement | null = null;

	async onload() {
		await this.loadSettings();

		// Регистрируем settings tab
		this.addSettingTab(
			new MultistateCheckboxesSettingTab(this.app, this),
		);

		// Генерируем и применяем CSS
		this.applyDynamicCSS();

		// Команда циклического переключения (без хоткея — хоткей регистрируется ниже по физической клавише)
		this.addCommand({
			id: "cycle-checkbox-state",
			name: "Cycle checkbox state",
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView,
			) => {
				if (checking) {
					return this.getCheckboxLine(editor) !== null;
				}
				const line = this.getCheckboxLine(editor);
				if (line) {
					this.cycleCheckbox(editor, line);
				}
			},
		});

		// Команда обратного переключения
		this.addCommand({
			id: "cycle-checkbox-state-backward",
			name: "Cycle checkbox state backward",
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView,
			) => {
				if (checking) {
					return this.getCheckboxLine(editor) !== null;
				}
				const line = this.getCheckboxLine(editor);
				if (line) {
					this.cycleCheckbox(editor, line, -1);
				}
			},
		});

		// Хоткеи по физической клавише: работают на любой раскладке
		this.registerDomEvent(document, "keydown", (evt: KeyboardEvent) => {
			if (
				evt.code === "KeyQ" &&
				evt.altKey &&
				!evt.ctrlKey &&
				!evt.metaKey
			) {
				const activeView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) return;
				const editor = activeView.editor;
				const line = this.getCheckboxLine(editor);
				if (line) {
					evt.preventDefault();
					evt.stopPropagation();
					const direction: 1 | -1 = evt.shiftKey ? -1 : 1;
					this.cycleCheckbox(editor, line, direction);
				}
			}
		});
	}

	onunload() {
		this.removeDynamicCSS();
	}

	// ─── Настройки ───────────────────────────────────────────────────────────

	async loadSettings() {
		const saved = await this.loadData();
		if (saved && saved.states) {
			// Миграция: добавляем отсутствующие состояния
			for (const s of ALL_STATES) {
				if (!saved.states[s.task]) {
					saved.states[s.task] = defaultStateSettings(s.task);
				}
			}
			if (!saved.cycleOrder) {
				saved.cycleOrder = DEFAULT_CYCLE_ORDER;
			}
			this.settings = saved as MultistateCheckboxesSettings;
		} else {
			this.settings = makeDefaultSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// ─── Динамический CSS ────────────────────────────────────────────────────

	applyDynamicCSS() {
		this.removeDynamicCSS();
		const css = generateCSS(this.settings);
		this.dynamicStyle = document.createElement("style");
		this.dynamicStyle.id = "multistate-checkboxes-dynamic";
		this.dynamicStyle.textContent = css;
		document.head.appendChild(this.dynamicStyle);
	}

	removeDynamicCSS() {
		if (this.dynamicStyle) {
			this.dynamicStyle.remove();
			this.dynamicStyle = null;
		}
	}

	refreshCSS() {
		this.applyDynamicCSS();
	}

	// ─── Циклическое переключение ────────────────────────────────────────────

	/**
	 * Возвращает информацию о строке с чекбоксом под курсором.
	 */
	private getCheckboxLine(
		editor: Editor,
	): { line: number; ch: number; currentTask: string } | null {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		const match = line.match(/^(\s*[-*]\s+\[)(.)(\].*)/);
		if (!match) return null;
		return {
			line: cursor.line,
			ch: match[1].length,
			currentTask: match[2],
		};
	}

	/**
	 * Циклически переключает состояние чекбокса.
	 * @param direction 1 — вперёд, -1 — назад.
	 */
	private cycleCheckbox(
		editor: Editor,
		info: { line: number; ch: number; currentTask: string },
		direction: 1 | -1 = 1,
	) {
		const originalCursor = editor.getCursor();

		const order = this.settings.cycleOrder;
		const enabledTasks = ALL_STATES.filter(
			(s) => this.settings.states[s.task]?.enabled,
		).map((s) => s.task);

		// Фильтруем cycleOrder: оставляем только символы из реально существующих и включённых стейтов
		const validOrder: string[] = [];
		for (const ch of order) {
			if (
				enabledTasks.includes(ch) &&
				!validOrder.includes(ch)
			) {
				validOrder.push(ch);
			}
		}

		// Если cycleOrder не покрывает какой-то включённый стейт — добавляем в конец
		for (const t of enabledTasks) {
			if (!validOrder.includes(t)) {
				validOrder.push(t);
			}
		}

		// Если ничего не включено — выходим
		if (validOrder.length === 0) return;

		// Находим текущий индекс и переключаем с учётом направления
		const currentIdx = validOrder.indexOf(info.currentTask);
		const nextIdx =
			currentIdx >= 0
				? (currentIdx + direction + validOrder.length) % validOrder.length
				: (direction === 1 ? 0 : validOrder.length - 1);
		const nextTask = validOrder[nextIdx];

		// Заменяем символ в строке
		const line = editor.getLine(info.line);
		const newLine =
			line.substring(0, info.ch) +
			nextTask +
			line.substring(info.ch + 1);
		editor.setLine(info.line, newLine);
		editor.setCursor({ line: originalCursor.line, ch: originalCursor.ch });
	}
}
