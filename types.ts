// ─── Типы ───────────────────────────────────────────────────────────────────

/** Метаданные одного состояния чекбокса. */
export interface CheckboxState {
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
export interface StateSettings {
	enabled: boolean;
}

/** Все настройки плагина. */
export interface MultistateCheckboxesSettings {
	states: Record<string, StateSettings>;
	/** Порядок цикла (строка из task-символов, напр. " x/>!"). */
	cycleOrder: string;
}
