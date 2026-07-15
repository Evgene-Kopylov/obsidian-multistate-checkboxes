import { Editor, MarkdownView } from "obsidian";
import { ALL_STATES } from "../states";
import type MultistateCheckboxesPlugin from "../main";

// ─── Циклическое переключение ────────────────────────────────────────────

export function registerCycleCommands(plugin: MultistateCheckboxesPlugin): void {
	// Команда переключения вперёд
	plugin.addCommand({
		id: "cycle-checkbox-state",
		name: "Cycle checkbox state",
		editorCheckCallback: (
			checking: boolean,
			editor: Editor,
			view: MarkdownView,
		) => {
			if (checking) return getCheckboxLine(editor) !== null;
			const line = getCheckboxLine(editor);
			if (line) cycleCheckbox(plugin, editor, line, 1);
		},
	});

	// Команда переключения назад
	plugin.addCommand({
		id: "cycle-checkbox-state-backward",
		name: "Cycle checkbox state backward",
		editorCheckCallback: (
			checking: boolean,
			editor: Editor,
			view: MarkdownView,
		) => {
			if (checking) return getCheckboxLine(editor) !== null;
			const line = getCheckboxLine(editor);
			if (line) cycleCheckbox(plugin, editor, line, -1);
		},
	});

	// Хоткеи по физической клавише: работают на любой раскладке
	const doc = plugin.app.workspace.containerEl.ownerDocument;
	plugin.registerDomEvent(doc, "keydown", (evt: KeyboardEvent) => {
		if (
			evt.code === "KeyQ" &&
			evt.altKey &&
			!evt.ctrlKey &&
			!evt.metaKey
		) {
			const activeView =
				plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) return;
			const editor = activeView.editor;
			const line = getCheckboxLine(editor);
			if (line) {
				evt.preventDefault();
				evt.stopPropagation();
				const direction: 1 | -1 = evt.shiftKey ? -1 : 1;
				cycleCheckbox(plugin, editor, line, direction);
			}
		}
	});
}

/** Возвращает информацию о строке с чекбоксом под курсором. */
function getCheckboxLine(
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

/** Циклически переключает состояние чекбокса. */
function cycleCheckbox(
	plugin: MultistateCheckboxesPlugin,
	editor: Editor,
	info: { line: number; ch: number; currentTask: string },
	direction: 1 | -1,
) {
	const originalCursor = editor.getCursor();

	const order = plugin.settings.cycleOrder;
	const enabledTasks = ALL_STATES.filter(
		(s) => plugin.settings.states[s.task]?.enabled,
	).map((s) => s.task);

	// Фильтруем cycleOrder: оставляем только символы из реально существующих и включённых стейтов
	const validOrder: string[] = [];
	for (const ch of order) {
		if (enabledTasks.includes(ch) && !validOrder.includes(ch)) {
			validOrder.push(ch);
		}
	}

	// Если cycleOrder не покрывает какой-то включённый стейт — добавляем в конец
	for (const t of enabledTasks) {
		if (!validOrder.includes(t)) {
			validOrder.push(t);
		}
	}

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
