import type { MultistateCheckboxesSettings } from "./types";
import { ALL_STATES, STATE_MAP } from "./states";

// ─── Генератор CSS ──────────────────────────────────────────────────────────

/**
 * Генерирует CSS-строку из текущих настроек.
 * Только для активных (enabled) состояний.
 */
export function generateCSS(settings: MultistateCheckboxesSettings): string {
	let css = "";
	const enabled = ALL_STATES.filter((s) => settings.states[s.task]?.enabled);

	// Собираем базовый селектор для всех mask-иконок (кроме x/-)
	const maskTasks = enabled.filter(
		(s) => s.iconType === "mask" && s.task !== "-" && s.task !== "x" && s.svg,
	);
	const bgTasks = enabled.filter(
		(s) => s.iconType === "background" && s.task !== "x",
	);

	// Хелпер: генерирует селекторы для data-task
	const taskSelectors = (task: string): string[] => [
		`input[data-task="${task}"]:checked`,
		`li[data-task="${task}"] > input:checked`,
		`li[data-task="${task}"] > p > input:checked`,
	];

	// Хелпер: селекторы для зачёркивания текста
	const strikeSelectors = (task: string): string[] => [
		`li[data-task="${task}"].task-list-item.is-checked`,
		`.HyperMD-task-line[data-task="${task}"]`,
	];

	// ── Базовые свойства для mask-иконок ──
	if (maskTasks.length > 0) {
		const selectors = maskTasks.flatMap((s) => taskSelectors(s.task));
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

	// ── Индивидуальные mask-иконки ──
	for (const s of maskTasks) {
		const color = s.defaultColor || "var(--text-faint)";
		css += `${taskSelectors(s.task).join(",\n")} {\n`;
		css += `\tcolor: ${color} !important;\n`;
		css += `\t-webkit-mask-image: url("${s.svg}") !important;\n`;
		if (s.extraCSS) css += `\t${s.extraCSS}\n`;
		css += `}\n\n`;
	}

	// ── Background-иконки ──
	for (const s of bgTasks) {
		const bgColor = s.defaultColor || "#e5b567";
		css += `${taskSelectors(s.task).join(",\n")} {\n`;
		css += `\t--checkbox-marker-color: transparent !important;\n`;
		css += `\tbackground-color: ${bgColor} !important;\n`;
		css += `\tborder-color: ${bgColor} !important;\n`;
		css += `\tbackground-position: 50% 50% !important;\n`;
		css += `\tbackground-size: contain !important;\n`;
		css += `\tbackground-repeat: no-repeat !important;\n`;
		css += `\tbackground-image: url('${s.svg}') !important;\n`;
		css += `}\n\n`;
	}

	// ── [x] галочка ──
	const xEnabled = settings.states["x"]?.enabled;
	if (xEnabled) {
		const xSelectors = [
			...taskSelectors("x"),
			...taskSelectors("X"),
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
		const minusSelectors = taskSelectors("-");
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
		const allSelectors = noStrike.flatMap((s) => strikeSelectors(s.task));
		css += `${allSelectors.join(",\n")} {\n`;
		css += `\tcolor: var(--text-normal);\n`;
		css += `\ttext-decoration: none !important;\n`;
		css += `}\n\n`;
	}

	// Зачёркивание для [-]
	const minusState = enabled.find((s) => s.task === "-");
	if (minusState && minusState.strikethrough) {
		css += `${strikeSelectors("-").join(",\n")} {\n`;
		css += `\tcolor: var(--text-faint) !important;\n`;
		css += `\ttext-decoration: line-through !important;\n`;
		css += `}\n\n`;
	}

	// Убрать зачёркивание для [x]
	if (xEnabled) {
		css += `${[...strikeSelectors("x"), ...strikeSelectors("X")].join(",\n")} {\n`;
		css += `\ttext-decoration: none !important;\n`;
		css += `}\n`;
	}

	return css;
}
