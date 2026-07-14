import {
    App,
    PluginSettingTab,
    Setting,
    TextComponent,
} from "obsidian";
import type { CheckboxState } from "./types";
import { ALL_STATES, STATE_MAP, DEFAULT_CYCLE_ORDER } from "./states";
import type MultistateCheckboxesPlugin from "./main";

class MultistateCheckboxesSettingTab extends PluginSettingTab {
    plugin: MultistateCheckboxesPlugin;
    private statesEl!: HTMLElement;
    private cycleText!: TextComponent;

    constructor(
        app: App,
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

        containerEl.createEl("h2", {
            text: "Cycle order",
        });

        containerEl.createEl("p", {
            text: "Drag items to reorder. Disabled states appear at the bottom.",
            cls: "setting-item-description",
        });

        new Setting(containerEl)
            .setName("Cycle order string")
            .setDesc("Task character string, e.g. \" />!*\"")
            .addText((text) => {
                this.cycleText = text;
                text.setValue(this.plugin.settings.cycleOrder);
                text.setPlaceholder(DEFAULT_CYCLE_ORDER);
                text.onChange(async (value) => {
                    this.plugin.settings.cycleOrder = value;
                    await this.plugin.saveSettings();
                    this.renderStates();
                });
            })
            .addExtraButton((btn) => {
                btn.setIcon("reset")
                    .setTooltip("Reset to default order")
                    .onClick(async () => {
                        this.plugin.settings.cycleOrder = DEFAULT_CYCLE_ORDER;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        this.statesEl = containerEl.createEl("div");
        this.renderStates();
    }

    /** Рендерит стейты в порядке cycleOrder с drag-and-drop. */
    private renderStates(): void {
        const container = this.statesEl;
        container.empty();
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "0";

        // Получаем порядок: включённые по cycleOrder, затем выключенные
        const order = this.plugin.settings.cycleOrder || DEFAULT_CYCLE_ORDER;
        const items: CheckboxState[] = [];
        const seen = new Set<string>();

        for (const ch of order) {
            if (!seen.has(ch)) {
                seen.add(ch);
                const state = STATE_MAP[ch];
                if (state) items.push(state);
            }
        }
        for (const s of ALL_STATES) {
            if (!seen.has(s.task)) {
                items.push(s);
            }
        }

        for (let i = 0; i < items.length; i++) {
            const state = items[i];
            const ss = this.plugin.settings.states[state.task];
            const enabled = ss.enabled;

            const div = container.createEl("div", {
                cls: "multistate-state-container",
            });
            div.draggable = true;
            div.dataset.task = state.task;
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.padding = "4px 8px";
            div.style.borderRadius = "6px";
            div.style.cursor = "grab";
            div.style.userSelect = "none";
            div.style.border = "1px solid var(--background-modifier-border)";
            div.style.background = "var(--background-modifier-form-field)";
            div.style.transition = "none";
            div.style.opacity = enabled ? "1" : "0.5";

            // Drag handle
            const handle = document.createElement("span");
            handle.textContent = "⋮⋮";
            handle.style.marginRight = "8px";
            handle.style.color = "var(--text-muted)";
            handle.style.fontSize = "14px";
            handle.style.cursor = "grab";
            div.appendChild(handle);

            // Icon + label
            const nameFrag = this.createIconPreview(state);
            nameFrag.appendChild(document.createTextNode(` [${state.task}]`));
            const labelEl = document.createElement("span");
            labelEl.style.flexGrow = "1";
            labelEl.appendChild(nameFrag);
            		div.appendChild(labelEl);

            		// Toggle
            		const toggleWrap = document.createElement("div");
            		toggleWrap.classList.add("checkbox-container");
            		if (enabled) toggleWrap.classList.add("is-enabled");
            		const toggleEl = document.createElement("input");
            		toggleEl.type = "checkbox";
            		toggleEl.tabIndex = -1;
            		toggleEl.checked = enabled;
            		toggleEl.addEventListener("change", async () => {
            			ss.enabled = toggleEl.checked;
            			if (toggleEl.checked) {
            				toggleWrap.classList.add("is-enabled");
            			} else {
            				toggleWrap.classList.remove("is-enabled");
            			}
            			await this.plugin.saveSettings();
            			this.plugin.refreshCSS();
            			this.renderStates();
            		});
            		toggleWrap.addEventListener("pointerdown", (e) => {
            			e.stopPropagation();
            		});
            		toggleWrap.appendChild(toggleEl);
            		div.appendChild(toggleWrap);

            // Drag events
            this.setupStateDragHandlers(div, container);
        }
    }

    private setupStateDragHandlers(
        itemEl: HTMLElement,
        container: HTMLElement,
    ): void {
        const BORDER = "1px solid var(--background-modifier-border)";
        const DASHED = "1px dashed var(--interactive-accent)";

        itemEl.addEventListener("dragstart", (e) => {
            (e.target as HTMLElement).style.opacity = "0.4";
            e.dataTransfer!.effectAllowed = "move";
        });
        itemEl.addEventListener("dragend", (e) => {
            (e.target as HTMLElement).style.opacity = "1";
            container.querySelectorAll(".multistate-state-container").forEach((el) => {
                (el as HTMLElement).style.border = BORDER;
            });
        });
        itemEl.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = "move";
        });
        itemEl.addEventListener("dragenter", (e) => {
            e.preventDefault();
            itemEl.style.border = DASHED;
        });
        itemEl.addEventListener("dragleave", () => {
            itemEl.style.border = BORDER;
        });
        itemEl.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            itemEl.style.border = BORDER;

            const dragged = container.querySelector(
                ".multistate-state-container[style*=\"opacity: 0.4\"]",
            ) as HTMLElement | null;
            if (!dragged || dragged === itemEl) return;

            const rect = itemEl.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
                container.insertBefore(dragged, itemEl);
            } else {
                container.insertBefore(dragged, itemEl.nextSibling);
            }

            // Обновляем cycleOrder из DOM-порядка
            const tasks: string[] = [];
            container.querySelectorAll(".multistate-state-container").forEach((el) => {
                tasks.push((el as HTMLElement).dataset.task!);
            });
            this.plugin.settings.cycleOrder = tasks.join("");
            this.plugin.saveSettings();
            this.cycleText.setValue(this.plugin.settings.cycleOrder);
        });
    }

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
}

export default MultistateCheckboxesSettingTab;
