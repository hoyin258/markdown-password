import { App, Modal, Setting, PluginSettingTab, Notice } from "obsidian";
import { VaultCore } from "../core/VaultCore";

export class UnlockModal extends Modal {
  private pass = "";
  constructor(app: App, private core: VaultCore, private onDone: (s: boolean) => void) { super(app); }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Unlock & Auto-Encrypt" });
    new Setting(contentEl).setName("Master Key").addText(t => {
      const input = t.setPlaceholder("Enter password").onChange(v => this.pass = v).inputEl;
      input.type = "password";
      input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") await this.attemptUnlock();
      });
    });
    new Setting(contentEl).addButton(b => b.setButtonText("Unlock & Enable Encryption").setCta().onClick(() => this.attemptUnlock()));
  }

  async attemptUnlock() {
    const ok = await this.core.unlock(this.pass);
    if (ok) { this.onDone(true); this.close(); }
    else new Notice("Invalid Password");
  }
}

export class VaultSettingsTab extends PluginSettingTab {
  private tempPass = "";
  constructor(app: App, plugin: any, private core: VaultCore) { super(app, plugin); }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Markdown Password Settings" });

    const isUnlocked = this.core.isUnlocked();
    const status = isUnlocked ? "Unlocked (Auto-encrypt ON)" : "Locked (Auto-encrypt OFF)";
    
    const statusEl = containerEl.createEl("p", { text: `Status: ${status}` });
    statusEl.style.color = isUnlocked ? "var(--text-success)" : "var(--text-error)";
    statusEl.style.fontWeight = "bold";

    if (!isUnlocked) {
      new Setting(containerEl)
        .setName("Master Key")
        .setDesc("Enter master key to unlock and enable automatic encryption.")
        .addText(t => {
          t.inputEl.type = "password";
          t.onChange(v => this.tempPass = v);
          t.inputEl.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") await this.handleUnlock();
          });
        });

      new Setting(containerEl)
        .addButton(b => b.setButtonText("Unlock & Auto-Encrypt").setCta().onClick(() => this.handleUnlock()));
    } else {
      new Setting(containerEl)
        .setName("Privacy & Protection Control")
        .setDesc("Lock the vault and stop automatic encryption for new input.")
        .addButton(b => b.setButtonText("Lock & Disable Encryption").onClick(() => {
          this.core.lock();
          this.display();
          new Notice("Vault locked & Auto-encryption disabled");
        }));
    }

    containerEl.createEl("hr");
    containerEl.createEl("h3", { text: "Danger Zone" });

    new Setting(containerEl)
      .setName("Reset Vault")
      .setDesc("Permanently delete all encrypted data. This cannot be undone.")
      .addButton(b => b.setButtonText("Reset").setWarning().onClick(async () => {
        if (confirm("Delete all encrypted data? This is permanent.")) {
          await this.core.reset();
          new Notice("Vault deleted");
          this.display();
        }
      }));
  }

  async handleUnlock() {
    if (this.tempPass.length < 1) return;
    const ok = await this.core.unlock(this.tempPass);
    if (ok) {
      new Notice("Vault accessible");
      this.tempPass = "";
      this.display();
    } else {
      new Notice("Invalid Password");
    }
  }
}
