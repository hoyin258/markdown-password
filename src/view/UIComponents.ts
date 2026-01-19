import { App, Modal, Setting, PluginSettingTab, Notice, Plugin } from "obsidian";
import { VaultCore } from "../core/VaultCore";

class ConfirmModal extends Modal {
  constructor(app: App, private message: string, private onConfirm: () => void) { super(app); }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Are you sure?" });
    contentEl.createEl("p", { text: this.message });
    new Setting(contentEl)
      .addButton(b => b.setButtonText("Cancel").onClick(() => this.close()))
      .addButton(b => b.setButtonText("Confirm").setWarning().onClick(() => {
        this.onConfirm();
        this.close();
      }));
  }
}

export class UnlockModal extends Modal {
  private pass = "";
  constructor(app: App, private core: VaultCore, private onDone: (s: boolean) => void) { super(app); }
  onOpen() {
    const { contentEl } = this;
    new Setting(contentEl).setHeading().setName("Unlock & Auto-Encrypt");
    new Setting(contentEl).setName("Master Key").addText(t => {
      const input = t.setPlaceholder("Enter password").onChange(v => this.pass = v).inputEl;
      input.type = "password";
      input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          await this.attemptUnlock();
        }
      });
    });
    new Setting(contentEl).addButton(b => b.setButtonText("Unlock & Enable Encryption").setCta().onClick(() => {
        void this.attemptUnlock();
    }));
  }

  async attemptUnlock() {
    const ok = await this.core.unlock(this.pass);
    if (ok) { this.onDone(true); this.close(); }
    else new Notice("Invalid Password");
  }
}

export class VaultSettingsTab extends PluginSettingTab {
  private tempPass = "";
  constructor(app: App, plugin: Plugin, private core: VaultCore) { super(app, plugin); }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setHeading().setName("Markdown Password Settings");

    const isUnlocked = this.core.isUnlocked();
    const status = isUnlocked ? "Unlocked (Auto-encrypt ON)" : "Locked (Auto-encrypt OFF)";
    
    new Setting(containerEl)
        .setName("Status")
        .setDesc(status)
        .then(s => {
            s.controlEl.createSpan({ 
                text: status, 
                cls: isUnlocked ? "vault-status-unlocked" : "vault-status-locked" 
            });
            // Clear the description since we are using a custom span in controlEl
            s.setDesc("");
        });

    if (!isUnlocked) {
      new Setting(containerEl)
        .setName("Master Key")
        .setDesc("Enter master key to unlock and enable automatic encryption.")
        .addText(t => {
          t.inputEl.type = "password";
          t.onChange(v => this.tempPass = v);
          t.inputEl.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                await this.handleUnlock();
            }
          });
        });

      new Setting(containerEl)
        .addButton(b => b.setButtonText("Unlock & Auto-Encrypt").setCta().onClick(() => {
            void this.handleUnlock();
        }));
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

    new Setting(containerEl).setHeading().setName("Danger Zone");

    new Setting(containerEl)
      .setName("Reset Vault")
      .setDesc("Permanently delete all encrypted data. This cannot be undone.")
      .addButton(b => b.setButtonText("Reset").setWarning().onClick(() => {
        new ConfirmModal(this.app, "Delete all encrypted data? This is permanent.", async () => {
          await this.core.reset();
          new Notice("Vault deleted");
          this.display();
        }).open();
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
