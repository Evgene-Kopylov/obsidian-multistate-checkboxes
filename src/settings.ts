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

        		new Setting(containerEl)
        			.setName("States")
        			.setHeading();

        		new Setting(containerEl)
        			.setName("Cycle order")
        			.setHeading();

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

        this.statesEl = containerEl.createEl("div", {
            cls: "multistate-states-list",
        });
        this.renderStates();
    }

    private renderStates(): void {
        const container = this.statesEl;
        container.empty();

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

        for (const state of items) {
    	        const ss = this.plugin.settings.states[state.task]!;
    	        const enabled = ss.enabled;

            const doc = container.ownerDocument;

            const div = doc.createElement("div");
            div.className = "multistate-state-item";
            if (!enabled) {
                div.classList.add("multistate-state-disabled");
            }
            div.draggable = true;
            div.dataset.task = state.task;

            // Icon + label
            const labelEl = doc.createElement("span");
            labelEl.className = "multistate-state-label";
            labelEl.appendChild(this.createIconPreview(state, doc));
            labelEl.appendChild(doc.createTextNode(` [${state.task}]`));
            div.appendChild(labelEl);

            // Drag handle
            const handle = doc.createElement("span");
            handle.className = "multistate-drag-handle";
            handle.textContent = "\u22EE\u22EE\u22EE\u22EE";
            div.appendChild(handle);

            // Toggle
            const toggleWrap = doc.createElement("div");
            toggleWrap.classList.add("checkbox-container");
            if (enabled) toggleWrap.classList.add("is-enabled");
            const toggleEl = doc.createElement("input");
            toggleEl.type = "checkbox";
            toggleEl.tabIndex = -1;
            toggleEl.checked = enabled;
            toggleWrap.appendChild(toggleEl);

            toggleWrap.addEventListener("click", () => {
                toggleEl.checked = !toggleEl.checked;
                toggleEl.dispatchEvent(new Event("change"));
            });

            toggleEl.addEventListener("change", () => {
                ss.enabled = toggleEl.checked;
                if (toggleEl.checked) {
                    toggleWrap.classList.add("is-enabled");
                    div.classList.remove("multistate-state-disabled");
                } else {
                    toggleWrap.classList.remove("is-enabled");
                    div.classList.add("multistate-state-disabled");
                }
                void this.plugin.saveSettings().then(() => {
                    this.plugin.refreshUI();
                });
            });
            div.appendChild(toggleWrap);

            this.setupStateDragHandlers(div, container);
            container.appendChild(div);
        }
    }

    private setupStateDragHandlers(
        itemEl: HTMLElement,
        container: HTMLElement,
    ): void {
        itemEl.addEventListener("dragstart", (e) => {
            itemEl.classList.add("multistate-dragging");
            e.dataTransfer!.effectAllowed = "move";
        });
        itemEl.addEventListener("dragend", () => {
            itemEl.classList.remove("multistate-dragging");
            container.querySelectorAll(".multistate-state-item").forEach((el) => {
                el.classList.remove("multistate-drag-over");
            });
        });
        itemEl.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = "move";
        });
        itemEl.addEventListener("dragenter", (e) => {
            e.preventDefault();
            itemEl.classList.add("multistate-drag-over");
        });
        itemEl.addEventListener("dragleave", () => {
            itemEl.classList.remove("multistate-drag-over");
        });
        itemEl.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            itemEl.classList.remove("multistate-drag-over");

    	        const dragged = container.querySelector(
    	            ".multistate-state-item.multistate-dragging",
    	        );
            if (!dragged || dragged === itemEl) return;

            const rect = itemEl.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
                container.insertBefore(dragged, itemEl);
            } else {
                container.insertBefore(dragged, itemEl.nextSibling);
            }

            const tasks: string[] = [];
            container.querySelectorAll(".multistate-state-item").forEach((el) => {
                const task = (el as HTMLElement).dataset.task;
                if (task) tasks.push(task);
            });
            this.plugin.settings.cycleOrder = tasks.join("");
            void this.plugin.saveSettings();
            this.cycleText.setValue(this.plugin.settings.cycleOrder);
        });
    }

    private createIconPreview(state: CheckboxState, doc: Document): DocumentFragment {
        const frag = doc.createDocumentFragment();
        const span = doc.createElement("span");
        span.className = "multistate-icon-preview";

        const svg = state.svg;

        if (!svg) {
            span.classList.add("multistate-icon-no-svg");
        } else if (state.iconType === "mask") {
            span.classList.add("multistate-icon-mask");
            span.style.setProperty(
                "--ms-preview-color",
                state.defaultColor || "var(--text-faint)",
            );
            span.style.setProperty("--ms-preview-url", `url("${svg}")`);
        } else {
            span.classList.add("multistate-icon-bg");
            span.style.setProperty(
                "--ms-preview-color",
                state.defaultColor || "var(--interactive-accent)",
            );
            span.style.setProperty("--ms-preview-url", `url('${svg}')`);
        }

        frag.appendChild(span);
        return frag;
    }
}

export default MultistateCheckboxesSettingTab;
