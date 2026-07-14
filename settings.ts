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
    private previewEl!: HTMLElement;
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
            text: 'Character order for the "Cycle checkbox state" command.',
            cls: "setting-item-description",
        });

        new Setting(containerEl)
            .setName("Cycle order")
            .setDesc("Task character string, e.g. \" />!*\"")
            .addText((text) => {
                this.cycleText = text;
                text.setValue(this.plugin.settings.cycleOrder);
                text.setPlaceholder(DEFAULT_CYCLE_ORDER);
                text.onChange(async (value) => {
                    this.plugin.settings.cycleOrder = value;
                    await this.plugin.saveSettings();
                    this.renderCyclePreview();
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

        containerEl.createEl("p", {
            text: "Drag items to reorder.",
            cls: "setting-item-description",
        });

        this.previewEl = containerEl.createEl("div", {
            cls: "multistate-cycle-preview",
        });
        this.renderCyclePreview();

        containerEl.createEl("h2", {
            text: "States",
        });

        for (const state of ALL_STATES) {
            const ss = this.plugin.settings.states[state.task];

            const div = containerEl.createEl("div", {
                cls: "multistate-state-container",
            });

            const headerDiv = div.createEl("div", {
                cls: "multistate-state-header",
            });

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
                        this.renderCyclePreview();
                    });
                });
        }
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

    private renderCyclePreview(): void {
        const container = this.previewEl;
        container.empty();
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.flexWrap = "wrap";
        container.style.gap = "4px";
        container.style.marginTop = "8px";

        const order = this.plugin.settings.cycleOrder || DEFAULT_CYCLE_ORDER;
        const enabled = new Set(
            ALL_STATES.filter((s) => this.plugin.settings.states[s.task]?.enabled).map((s) => s.task),
        );

        const seen = new Set<string>();
        const items: CheckboxState[] = [];
        for (const ch of order) {
            if (enabled.has(ch) && !seen.has(ch)) {
                seen.add(ch);
                const state = STATE_MAP[ch];
                if (state) items.push(state);
            }
        }
        for (const s of ALL_STATES) {
            if (enabled.has(s.task) && !seen.has(s.task)) {
                items.push(s);
            }
        }

        if (items.length === 0) {
            container.createEl("span", {
                text: "No enabled states",
                cls: "setting-item-description",
            });
            return;
        }

        for (let i = 0; i < items.length; i++) {
            const state = items[i];

            const itemEl = container.createEl("span", {
                cls: "multistate-cycle-item",
            });
            itemEl.draggable = true;
            itemEl.dataset.task = state.task;
            itemEl.style.display = "inline-flex";
            itemEl.style.alignItems = "center";
            itemEl.style.padding = "4px 8px";
            itemEl.style.borderRadius = "6px";
            itemEl.style.cursor = "grab";
            itemEl.style.userSelect = "none";
            itemEl.style.border = "1px solid var(--background-modifier-border)";
            itemEl.style.background = "var(--background-modifier-form-field)";
            itemEl.style.transition = "none";

            const handle = document.createElement("span");
            handle.textContent = "\u22EE\u22EE";
            handle.style.marginRight = "4px";
            handle.style.color = "var(--text-muted)";
            handle.style.fontSize = "14px";
            handle.style.cursor = "grab";
            itemEl.appendChild(handle);

            const iconPreview = this.createIconPreview(state);
            itemEl.appendChild(iconPreview);

            itemEl.appendChild(document.createTextNode(`[${state.task}]`));

            this.setupDragHandlers(itemEl, container);
        }
    }

    private setupDragHandlers(itemEl: HTMLElement, container: HTMLElement): void {
        const BORDER = "1px solid var(--background-modifier-border)";
        const DASHED = "1px dashed var(--interactive-accent)";

        itemEl.addEventListener("dragstart", (e) => {
            (e.target as HTMLElement).style.opacity = "0.4";
            e.dataTransfer!.effectAllowed = "move";
        });
        itemEl.addEventListener("dragend", (e) => {
            (e.target as HTMLElement).style.opacity = "1";
            container.querySelectorAll(".multistate-cycle-item").forEach((el) => {
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
                ".multistate-cycle-item[style*=\"opacity: 0.4\"]",
            ) as HTMLElement | null;
            if (!dragged || dragged === itemEl) return;

            const rect = itemEl.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            if (e.clientX < midX) {
                container.insertBefore(dragged, itemEl);
            } else {
                container.insertBefore(dragged, itemEl.nextSibling);
            }

            const tasks: string[] = [];
            container.querySelectorAll(".multistate-cycle-item").forEach((el) => {
                tasks.push((el as HTMLElement).dataset.task!);
            });
            this.plugin.settings.cycleOrder = tasks.join("");
            this.plugin.saveSettings();
            this.cycleText.setValue(this.plugin.settings.cycleOrder);
        });
    }
}

export default MultistateCheckboxesSettingTab;
