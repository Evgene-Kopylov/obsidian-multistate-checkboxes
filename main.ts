import {
	Plugin,
	PluginSettingTab,
	Setting,
	Editor,
	MarkdownView,
} from "obsidian";

// ─── Типы ───────────────────────────────────────────────────────────────────

/** Метаданные одного состояния чекбокса. */
interface CheckboxState {
	/** Символ задачи в Markdown (напр. "x", ">", "!"). */
	task: string;
	/** Человеческое название для UI. */
	name: string;
	/** CSS-цвет по умолчанию (или null, если заливка background-ом). */
	defaultColor: string | null;
	/** Тип иконки: "mask" — через -webkit-mask-image, "background" — через background-image. */
	iconType: "mask" | "background";
	/** SVG-иконка (сырой XML или data-URI). */
	svg: string;
	/** Дополнительные CSS-свойства (напр. transform для ">"). */
	extraCSS: string;
	/** Не зачёркивать текст строки. */
	noStrikethrough: boolean;
	/** Отдельный блок для зачёркивания (как для "-"). */
	strikethrough: boolean;
}

/** Пользовательские настройки для одного состояния. */
interface StateSettings {
	enabled: boolean;
}

/** Все настройки плагина. */
interface MultistateCheckboxesSettings {
	states: Record<string, StateSettings>;
	/** Порядок цикла (строка из task-символов, напр. " x/>!"). */
	cycleOrder: string;
}

// ─── Все состояния по умолчанию ─────────────────────────────────────────────

const ALL_STATES: CheckboxState[] = [
	{
		task: " ",
		name: "Не выполнено",
		defaultColor: null,
		iconType: "mask",
		svg: "",
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "x",
		name: "Выполнено",
		defaultColor: null,
		iconType: "background",
		svg: `data:image/svg+xml,%3Csvg xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="20 6 9 17 4 12"%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "-",
		name: "Отменено",
		defaultColor: "var(--text-faint)",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: false,
		strikethrough: true,
	},
	{
		task: ">",
		name: "Перенесено",
		defaultColor: "var(--text-faint)",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z' /%3E%3C/svg%3E`,
		extraCSS: "transform: rotate(90deg); -webkit-mask-position: 50% 100%;",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "<",
		name: "Запланировано",
		defaultColor: "var(--text-faint)",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "?",
		name: "Вопрос",
		defaultColor: null,
		iconType: "background",
		svg: `data:image/svg+xml,%3Csvg xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width="20" height="20" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"%3E%3Cpath fill="white" fill-rule="evenodd" d="M4.475 5.458c-.284 0-.514-.237-.47-.517C4.28 3.24 5.576 2 7.825 2c2.25 0 3.767 1.36 3.767 3.215c0 1.344-.665 2.288-1.79 2.973c-1.1.659-1.414 1.118-1.414 2.01v.03a.5.5 0 0 1-.5.5h-.77a.5.5 0 0 1-.5-.495l-.003-.2c-.043-1.221.477-2.001 1.645-2.712c1.03-.632 1.397-1.135 1.397-2.028c0-.979-.758-1.698-1.926-1.698c-1.009 0-1.71.529-1.938 1.402c-.066.254-.278.461-.54.461h-.777ZM7.496 14c.622 0 1.095-.474 1.095-1.09c0-.618-.473-1.092-1.095-1.092c-.606 0-1.087.474-1.087 1.091S6.89 14 7.496 14Z"%2F%3E%3C%2Fsvg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "/",
		name: "В процессе",
		defaultColor: null,
		iconType: "background",
		svg: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Crect x="0" y="0" width="12" height="24" fill="%23555" /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "!",
		name: "Важно",
		defaultColor: "#e87d3e",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "*",
		name: "Приоритет",
		defaultColor: "#e5b567",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: '"',
		name: "Цитата",
		defaultColor: null,
		iconType: "background",
		svg: `data:image/svg+xml,%3Csvg xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width="20" height="20" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"%3E%3Cpath fill="white" d="M6.5 10c-.223 0-.437.034-.65.065c.069-.232.14-.468.254-.68c.114-.308.292-.575.469-.844c.148-.291.409-.488.601-.737c.201-.242.475-.403.692-.604c.213-.21.492-.315.714-.463c.232-.133.434-.28.65-.35l.539-.222l.474-.197l-.485-1.938l-.597.144c-.191.048-.424.104-.689.171c-.271.05-.56.187-.882.312c-.318.142-.686.238-1.028.466c-.344.218-.741.4-1.091.692c-.339.301-.748.562-1.05.945c-.33.358-.656.734-.909 1.162c-.293.408-.492.856-.702 1.299c-.19.443-.343.896-.468 1.336c-.237.882-.343 1.72-.384 2.437c-.034.718-.014 1.315.028 1.747c.015.204.043.402.063.539l.025.168l.026-.006A4.5 4.5 0 1 0 6.5 10zm11 0c-.223 0-.437.034-.65.065c.069-.232.14-.468.254-.68c.114-.308.292-.575.469-.844c.148-.291.409-.488.601-.737c.201-.242.475-.403.692-.604c.213-.21.492-.315.714-.463c.232-.133.434-.28.65-.35l.539-.222l.474-.197l-.485-1.938l-.597.144c-.191.048-.424.104-.689.171c-.271.05-.56.187-.882.312c-.317.143-.686.238-1.028.467c-.344.218-.741.4-1.091.692c-.339.301-.748.562-1.05.944c-.33.358-.656.734-.909 1.162c-.293.408-.492.856-.702 1.299c-.19.443-.343.896-.468 1.336c-.237.882-.343 1.72-.384 2.437c-.034.718-.014 1.315.028 1.747c.015.204.043.402.063.539l.025.168l.026-.006A4.5 4.5 0 1 0 17.5 10z"%2F%3E%3C%2Fsvg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "l",
		name: "Локация",
		defaultColor: "#e83e3e",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "i",
		name: "Информация",
		defaultColor: null,
		iconType: "background",
		svg: `data:image/svg+xml,%3Csvg xmlns="http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width="20" height="20" preserveAspectRatio="xMidYMid meet" viewBox="0 0 512 512"%3E%3Cpath fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="40" d="M196 220h64v172"%2F%3E%3Cpath fill="none" stroke="white" stroke-linecap="round" stroke-miterlimit="10" stroke-width="40" d="M187 396h138"%2F%3E%3Cpath fill="white" d="M256 160a32 32 0 1 1 32-32a32 32 0 0 1-32 32Z"%2F%3E%3C%2Fsvg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "I",
		name: "Идея",
		defaultColor: "#e5b567",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "f",
		name: "Огонь",
		defaultColor: "#e83e3e",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "k",
		name: "Ключ",
		defaultColor: "#e5b567",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "u",
		name: "Вверх",
		defaultColor: "#3eb4bf",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "d",
		name: "Вниз",
		defaultColor: "#e83e3e",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "w",
		name: "Победа",
		defaultColor: "#9e86c8",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "p",
		name: "Плюс",
		defaultColor: "#3eb4bf",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "c",
		name: "Минус",
		defaultColor: "#e87d3e",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
	{
		task: "b",
		name: "Закладка",
		defaultColor: "#e87d3e",
		iconType: "mask",
		svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z' /%3E%3C/svg%3E`,
		extraCSS: "",
		noStrikethrough: true,
		strikethrough: false,
	},
];

// Карта task → CheckboxState для быстрого доступа
const STATE_MAP: Record<string, CheckboxState> = {};
for (const s of ALL_STATES) {
	STATE_MAP[s.task] = s;
}

// Дефолтный порядок цикла (все состояния, кроме x/-)
const DEFAULT_CYCLE_ORDER = " />!*\"?liIfkudwpcb ";

// ─── Дефолтные настройки ─────────────────────────────────────────────────────

function defaultStateSettings(task: string): StateSettings {
	return {
		enabled: task === " " || task === "x" || task === "-" ? true : false,
	};
}

function makeDefaultSettings(): MultistateCheckboxesSettings {
	const states: Record<string, StateSettings> = {};
	for (const s of ALL_STATES) {
		states[s.task] = defaultStateSettings(s.task);
	}
	return {
		states,
		cycleOrder: DEFAULT_CYCLE_ORDER,
	};
}

const DEFAULT_SETTINGS = makeDefaultSettings();

// ─── Генератор CSS ──────────────────────────────────────────────────────────

/**
 * Генерирует CSS-строку из текущих настроек.
 * Только для активных (enabled) состояний.
 */
function generateCSS(settings: MultistateCheckboxesSettings): string {
	let css = "";
	const enabled = ALL_STATES.filter((s) => settings.states[s.task]?.enabled);

	// Собираем базовый селектор для всех mask-иконок (кроме x/-)
	const maskTasks = enabled.filter(
		(s) => s.iconType === "mask" && s.task !== "-" && s.task !== "x" && s.svg,
	);
	const bgTasks = enabled.filter(
		(s) => s.iconType === "background" && s.task !== "x",
	);

	// Разделяем mask-стейты на те, у кого есть extraCSS и без
	const maskSimple = maskTasks.filter((s) => !s.extraCSS);
	const maskExtra = maskTasks.filter((s) => s.extraCSS);

	// ── Базовые свойства для mask-иконок ──
	if (maskTasks.length > 0) {
		const selectors = maskTasks.flatMap((s) => [
			`input[data-task="${s.task}"]:checked`,
			`li[data-task="${s.task}"] > input:checked`,
			`li[data-task="${s.task}"] > p > input:checked`,
		]);
		css += `${selectors.join(",\n")} {\n`;
		css += `\t--checkbox-marker-color: transparent !important;\n`;
		css += `\tborder: none !important;\n`;
		css += `\tborder-radius: 0 !important;\n`;
		css += `\tbackground-image: none !important;\n`;
		css += `\tbackground-color: currentColor !important;\n`;
		css += `\t-webkit-mask-size: contain !important;\n`;
		css += `\t-webkit-mask-position: 50% 50% !important;\n`;
		css += `\t-webkit-mask-repeat: no-repeat !important;\n`;
		css += `}\n\n`;
	}

	// ── Индивидуальные mask-иконки без extraCSS ──
	for (const s of maskSimple) {
		const color = s.defaultColor || "var(--text-faint)";
		const svg = s.svg;
		const selectors = [
			`input[data-task="${s.task}"]:checked`,
			`li[data-task="${s.task}"] > input:checked`,
			`li[data-task="${s.task}"] > p > input:checked`,
		];
		css += `${selectors.join(",\n")} {\n`;
		css += `\tcolor: ${color} !important;\n`;
		css += `\t-webkit-mask-image: url("${svg}") !important;\n`;
		css += `}\n\n`;
	}

	// ── Индивидуальные mask-иконки с extraCSS ──
	for (const s of maskExtra) {
		const color = s.defaultColor || "var(--text-faint)";
		const svg = s.svg;
		const selectors = [
			`input[data-task="${s.task}"]:checked`,
			`li[data-task="${s.task}"] > input:checked`,
			`li[data-task="${s.task}"] > p > input:checked`,
		];
		css += `${selectors.join(",\n")} {\n`;
		css += `\tcolor: ${color} !important;\n`;
		css += `\t-webkit-mask-image: url("${svg}") !important;\n`;
		css += `\t${s.extraCSS}\n`;
		css += `}\n\n`;
	}

	// ── Background-иконки ──
	for (const s of bgTasks) {
		const bgColor = s.defaultColor || "#e5b567";
		const svg = s.svg;
		const selectors = [
			`input[data-task="${s.task}"]:checked`,
			`li[data-task="${s.task}"] > input:checked`,
			`li[data-task="${s.task}"] > p > input:checked`,
		];
		css += `${selectors.join(",\n")} {\n`;
		css += `\t--checkbox-marker-color: transparent !important;\n`;
		css += `\tbackground-color: ${bgColor} !important;\n`;
		css += `\tborder-color: ${bgColor} !important;\n`;
		css += `\tbackground-position: 50% 50% !important;\n`;
		css += `\tbackground-size: contain !important;\n`;
		css += `\tbackground-repeat: no-repeat !important;\n`;
		css += `\tbackground-image: url('${svg}') !important;\n`;
		css += `}\n\n`;
	}

	// ── [x] галочка ──
	const xEnabled = settings.states["x"]?.enabled;
	if (xEnabled) {
		const xSelectors = [
			`input[data-task="x"]:checked`,
			`input[data-task="X"]:checked`,
			`li[data-task="x"] > input:checked`,
			`li[data-task="x"] > p > input:checked`,
			`li[data-task="X"] > input:checked`,
			`li[data-task="X"] > p > input:checked`,
		];
		const xSvg = STATE_MAP["x"].svg;
		const xColor = "var(--interactive-accent)";
		css += `${xSelectors.join(",\n")} {\n`;
		css += `\t--checkbox-marker-color: transparent !important;\n`;
		css += `\tbackground-color: ${xColor} !important;\n`;
		css += `\tborder-color: ${xColor} !important;\n`;
		css += `\tbackground-image: url('${xSvg}') !important;\n`;
		css += `\tbackground-position: 50% 50% !important;\n`;
		css += `\tbackground-size: 100% 100% !important;\n`;
		css += `\tbackground-repeat: no-repeat !important;\n`;
		css += `}\n\n`;
	}

	// ── [-] минус ──
	const minusEnabled = settings.states["-"]?.enabled;
	if (minusEnabled) {
		const minusSelectors = [
			`input[data-task="-"]:checked`,
			`li[data-task="-"] > input:checked`,
			`li[data-task="-"] > p > input:checked`,
		];
		const minusColor = "var(--text-faint)";
		const minusSvg = STATE_MAP["-"].svg;
		css += `${minusSelectors.join(",\n")} {\n`;
		css += `\t--checkbox-marker-color: transparent !important;\n`;
		css += `\tborder: none !important;\n`;
		css += `\tborder-radius: 0 !important;\n`;
		css += `\tbackground-image: none !important;\n`;
		css += `\tbackground-color: currentColor !important;\n`;
		css += `\t-webkit-mask-size: contain !important;\n`;
		css += `\t-webkit-mask-position: 50% 50% !important;\n`;
		css += `\t-webkit-mask-repeat: no-repeat !important;\n`;
		css += `\tcolor: ${minusColor} !important;\n`;
		css += `\t-webkit-mask-image: url("${minusSvg}") !important;\n`;
		css += `}\n\n`;
	}

	// ── Управление зачёркиванием текста ──
	const noStrike = enabled.filter((s) => s.noStrikethrough);
	if (noStrike.length > 0) {
		const rvSelectors = noStrike.map(
			(s) => `li[data-task="${s.task}"].task-list-item.is-checked`,
		);
		const lpSelectors = noStrike.map(
			(s) => `.HyperMD-task-line[data-task="${s.task}"]`,
		);
		const allSelectors = [...rvSelectors, ...lpSelectors];
		css += `${allSelectors.join(",\n")} {\n`;
		css += `\tcolor: var(--text-normal);\n`;
		css += `\ttext-decoration: none !important;\n`;
		css += `}\n\n`;
	}

	// Зачёркивание для [-]
	const minusState = enabled.find((s) => s.task === "-");
	if (minusState && minusState.strikethrough) {
		css += `li[data-task="-"].task-list-item.is-checked,\n`;
		css += `.HyperMD-task-line[data-task="-"] {\n`;
		css += `\tcolor: var(--text-faint) !important;\n`;
		css += `\ttext-decoration: line-through !important;\n`;
		css += `}\n\n`;
	}

	// Убрать зачёркивание для [x]
	if (xEnabled) {
		css += `li[data-task="x"].task-list-item.is-checked,\n`;
		css += `li[data-task="X"].task-list-item.is-checked,\n`;
		css += `.HyperMD-task-line[data-task="x"],\n`;
		css += `.HyperMD-task-line[data-task="X"] {\n`;
		css += `\ttext-decoration: none !important;\n`;
		css += `}\n`;
	}

	return css;
}

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
			name: "Циклически переключить состояние чекбокса",
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
			name: "Циклически переключить состояние чекбокса назад",
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

// ─── Settings Tab ────────────────────────────────────────────────────────────

class MultistateCheckboxesSettingTab extends PluginSettingTab {
	plugin: MultistateCheckboxesPlugin;

	constructor(
		app: import("obsidian").App,
		plugin: MultistateCheckboxesPlugin,
	) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Multistate Checkboxes",
		});

		// ── Порядок цикла ──
		containerEl.createEl("h2", {
			text: "Циклическое переключение",
		});

		containerEl.createEl("p", {
			text: 'Порядок символов для команды "Циклически переключить состояние чекбокса".',
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Порядок цикла")
			.setDesc("Строка из task-символов, напр. \" />!*\"")
			.addText((text) => {
				text.setValue(this.plugin.settings.cycleOrder);
				text.setPlaceholder(DEFAULT_CYCLE_ORDER);
				text.onChange(async (value) => {
					this.plugin.settings.cycleOrder = value;
					await this.plugin.saveSettings();
					this.renderCyclePreview(previewEl);
				});
			})
			.addExtraButton((btn) => {
				btn.setIcon("reset")
					.setTooltip("Сбросить порядок по умолчанию")
					.onClick(async () => {
						this.plugin.settings.cycleOrder = DEFAULT_CYCLE_ORDER;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		const previewEl = containerEl.createEl("div", {
			cls: "multistate-cycle-preview",
		});
		this.renderCyclePreview(previewEl);

		containerEl.createEl("h2", {
			text: "Состояния",
		});

		for (const state of ALL_STATES) {
			const ss = this.plugin.settings.states[state.task];

			// Контейнер для одного состояния
			const div = containerEl.createEl("div", {
				cls: "multistate-state-container",
			});

			const headerDiv = div.createEl("div", {
				cls: "multistate-state-header",
			});

			// Toggle вкл/выкл
			const nameFrag = this.createIconPreview(state);
			nameFrag.appendChild(document.createTextNode(` [${state.task}]`));
			new Setting(headerDiv)
				.setName(nameFrag)
				.addToggle((toggle) => {
					toggle.setValue(ss.enabled);
					toggle.onChange(async (value) => {
						ss.enabled = value;
						await this.plugin.saveSettings();
						this.plugin.refreshCSS();
						this.renderCyclePreview(previewEl);
					});
				});
		}
	}

	/**
	 * Создаёт превью иконки состояния (18x18px).
	 */
	private createIconPreview(state: CheckboxState): DocumentFragment {
		const frag = new DocumentFragment();
		const span = document.createElement("span");

		const svg = state.svg;

		span.style.display = "inline-block";
		span.style.width = "18px";
		span.style.height = "18px";
		span.style.verticalAlign = "middle";
		span.style.marginRight = "6px";
		span.style.flexShrink = "0";

		if (!svg) {
			span.style.border = "1px solid var(--text-muted)";
			span.style.borderRadius = "4px";
		} else if (state.iconType === "mask") {
			span.style.backgroundColor =
				state.defaultColor || "var(--text-faint)";
			span.style.webkitMaskImage = `url("${svg}")`;
			span.style.webkitMaskSize = "contain";
			span.style.webkitMaskPosition = "center";
			span.style.webkitMaskRepeat = "no-repeat";
		} else {
			span.style.backgroundColor =
				state.defaultColor || "var(--interactive-accent)";
			span.style.backgroundImage = `url('${svg}')`;
			span.style.backgroundSize = "contain";
			span.style.backgroundPosition = "center";
			span.style.backgroundRepeat = "no-repeat";
			span.style.borderRadius = "4px";
		}

		frag.appendChild(span);
		return frag;
	}

	/**
	 * Рисует визуальный ряд порядка цикла: иконки со стрелками.
	 */
	private renderCyclePreview(container: HTMLElement): void {
		container.empty();
		container.style.display = "flex";
		container.style.alignItems = "center";
		container.style.flexWrap = "wrap";
		container.style.gap = "0";
		container.style.marginTop = "8px";

		const order = this.plugin.settings.cycleOrder || DEFAULT_CYCLE_ORDER;
		const enabled = new Set(
			ALL_STATES.filter((s) => this.plugin.settings.states[s.task]?.enabled).map((s) => s.task),
		);

		// Фильтруем порядок: только включённые стейты, без дубликатов
		const seen = new Set<string>();
		const items: CheckboxState[] = [];
		for (const ch of order) {
			if (enabled.has(ch) && !seen.has(ch)) {
				seen.add(ch);
				const state = STATE_MAP[ch];
				if (state) items.push(state);
			}
		}

		// Добавляем включённые стейты, не упомянутые в порядке
		for (const s of ALL_STATES) {
			if (enabled.has(s.task) && !seen.has(s.task)) {
				items.push(s);
			}
		}

		if (items.length === 0) {
			container.createEl("span", {
				text: "Нет включённых состояний",
				cls: "setting-item-description",
			});
			return;
		}

		for (let i = 0; i < items.length; i++) {
			const state = items[i];

			// Иконка
			const iconEl = container.createEl("span", {
				cls: "multistate-cycle-icon",
			});
			const iconPreview = this.createIconPreview(state);
			iconEl.appendChild(iconPreview);
			iconEl.style.display = "inline-flex";
			iconEl.style.alignItems = "center";
			iconEl.style.padding = "4px";

			// Текстовая метка
			iconEl.appendChild(document.createTextNode(`[${state.task}]`));

			// Стрелка (кроме последнего)
			if (i < items.length - 1) {
				const arrow = container.createEl("span", {
					text: "→",
					cls: "multistate-cycle-arrow",
				});
				arrow.style.margin = "0 4px";
				arrow.style.color = "var(--text-muted)";
			}
		}
	}
}
