import { Plugin } from "obsidian";
import type { MultistateCheckboxesSettings } from "./types";
import {
	ALL_STATES,
	defaultStateSettings,
	makeDefaultSettings,
	DEFAULT_CYCLE_ORDER,
} from "./states";
import MultistateCheckboxesSettingTab from "./settings";
import { registerCycleCommands } from "./commands/cycle";

export default class MultistateCheckboxesPlugin extends Plugin {
	settings: MultistateCheckboxesSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(
			new MultistateCheckboxesSettingTab(this.app, this),
		);

		this.updateBodyStateClasses();
		registerCycleCommands(this);
	}

	onunload() {
		const doc = this.app.workspace.containerEl.doc;
		doc.body.removeAttribute("data-multistate-disabled");
	}

	// ─── Настройки ───────────────────────────────────────────────────────────

	async loadSettings() {
		const data = await this.loadData();
		if (data && data.states) {
			// Миграция: добавляем отсутствующие состояния
			for (const s of ALL_STATES) {
				if (!data.states[s.task]) {
					data.states[s.task] = defaultStateSettings(s.task);
				}
			}
			if (!data.cycleOrder) {
				data.cycleOrder = DEFAULT_CYCLE_ORDER;
			}
			this.settings = data as MultistateCheckboxesSettings;
		} else {
			this.settings = makeDefaultSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// ─── Управление видимостью состояний ─────────────────────────────────────

	/** Обновляет data-атрибут на body: список выключенных состояний. */
	updateBodyStateClasses() {
		const doc = this.app.workspace.containerEl.doc;
		const disabled: string[] = [];
		for (const s of ALL_STATES) {
			if (!this.settings.states[s.task]?.enabled) {
				disabled.push(s.task);
			}
		}
		if (disabled.length > 0) {
			doc.body.setAttribute("data-multistate-disabled", disabled.join(" "));
		} else {
			doc.body.removeAttribute("data-multistate-disabled");
		}
	}

	refreshUI() {
		this.updateBodyStateClasses();
	}
}
