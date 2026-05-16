import { App, PluginSettingTab, Setting } from "obsidian";
import type DiaryTranscriberPlugin from "../main";
import { TranscriptionProvider, PROVIDERS } from "./types";

export interface PluginSettings {
  provider: TranscriptionProvider;
  gladiaApiKey: string;
  deepgramApiKey: string;
  assemblyaiApiKey: string;
  defaultLanguage: string;
  insertAsCallout: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  provider: "gladia",
  gladiaApiKey: "",
  deepgramApiKey: "",
  assemblyaiApiKey: "",
  defaultLanguage: "es",
  insertAsCallout: true,
};

export class SettingsTab extends PluginSettingTab {
  plugin: DiaryTranscriberPlugin;

  constructor(app: App, plugin: DiaryTranscriberPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Transcripción Obsidian" });

    new Setting(containerEl)
      .setName("Provider")
      .setDesc("Speech-to-text provider to use")
      .addDropdown((dropdown) => {
        for (const { value, label } of PROVIDERS) {
          dropdown.addOption(value, label);
        }
        dropdown
          .setValue(this.plugin.settings.provider)
          .onChange(async (v: string) => {
            this.plugin.settings.provider = v as TranscriptionProvider;
            await this.plugin.saveSettings();
            this.display();
          });
      });

    // --- Provider-specific API key fields ---
    if (this.plugin.settings.provider === "gladia") {
      this.addApiKeyField(containerEl, "Gladia API Key", "gladiaApiKey");
    } else if (this.plugin.settings.provider === "deepgram") {
      this.addApiKeyField(containerEl, "Deepgram API Key", "deepgramApiKey");
    } else {
      this.addApiKeyField(
        containerEl,
        "AssemblyAI API Key",
        "assemblyaiApiKey"
      );
    }

    // Show all keys in an advanced section
    containerEl.createEl("h3", { text: "All API Keys" });
    containerEl.createEl("p", {
      text: "Keys are stored locally in your vault's plugin data.",
      cls: "setting-item-description",
    });

    this.addApiKeyField(containerEl, "Gladia", "gladiaApiKey");
    this.addApiKeyField(containerEl, "Deepgram", "deepgramApiKey");
    this.addApiKeyField(containerEl, "AssemblyAI", "assemblyaiApiKey");

    new Setting(containerEl)
      .setName("Default language")
      .setDesc("ISO code: es, en, fr, pt...")
      .addText((text) =>
        text
          .setPlaceholder("es")
          .setValue(this.plugin.settings.defaultLanguage)
          .onChange(async (value) => {
            this.plugin.settings.defaultLanguage = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Wrap in callout")
      .setDesc("Insert transcription inside a >[!transcription] callout block")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.insertAsCallout)
          .onChange(async (value) => {
            this.plugin.settings.insertAsCallout = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private addApiKeyField(
    container: HTMLElement,
    name: string,
    key: "gladiaApiKey" | "deepgramApiKey" | "assemblyaiApiKey"
  ): void {
    new Setting(container).setName(name).addText((text) => {
      text
        .setPlaceholder("Enter your API key")
        .setValue(this.plugin.settings[key]);
      text.inputEl.type = "password";

      const toggleBtn = text.inputEl.parentElement?.createEl("button", {
        text: "Show",
        cls: "transcripcion-obsidian-toggle-key",
      });
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          const isPassword = text.inputEl.type === "password";
          text.inputEl.type = isPassword ? "text" : "password";
          toggleBtn.textContent = isPassword ? "Hide" : "Show";
        };
      }

      text.onChange(async (value) => {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
      });
    });
  }
}
