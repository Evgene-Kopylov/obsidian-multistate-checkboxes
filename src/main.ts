import { Plugin } from "obsidian";
import type { MultistateCheckboxesSettings } from "./types";
import {
	ALL_STATES,
	defaultStateSettings,
	makeDefaultSettings,
	DEFAULT_CYCLE_ORDER,
} from "./states";
import { generateCSS } from "./css";
import MultistateCheckboxesSettingTab from "./settings";
import { registerCycleCommands } from "./commands/cycle";

export default class MultistateCheckboxesPlugin extends Plugin {
	settings: MultistateCheckboxesSettings;
	private dynamicStyle: HTMLStyleElement | null = null;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(
			new MultistateCheckboxesSettingTab(this.app, this),
		);

		this.applyDynamicCSS();
		registerCycleCommands(this);
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
}
