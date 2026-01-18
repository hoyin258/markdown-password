import { Plugin, Notice, MarkdownView } from "obsidian";
import { VaultCore } from "./src/core/VaultCore";
import { vaultExtension } from "./src/view/EditorExtension";
import { PreviewProcessor } from "./src/view/PreviewProcessor";
import { UnlockModal, VaultSettingsTab } from "./src/view/UIComponents";

export default class ObsidianMarkdownPassword extends Plugin {
  private core: VaultCore;

  async onload() {
    this.core = new VaultCore(this.app);

    // Initial Unlock if exists
    if (await this.core.exists()) {
      this.promptUnlock();
    }

    // Register Editor & Preview
    this.registerEditorExtension(vaultExtension(this.core));
    const preview = new PreviewProcessor(this.core);
    this.registerMarkdownPostProcessor(preview.processor);

    // Settings
    this.addSettingTab(new VaultSettingsTab(this.app, this, this.core));

    // Commands
    this.addCommand({
      id: "unlock-auto-encrypt",
      name: "Unlock & Auto-Encrypt",
      callback: () => this.promptUnlock()
    });

    this.addCommand({
      id: "lock-disable-encryption",
      name: "Lock & Disable Encryption",
      callback: () => {
        this.core.lock();
        this.refresh();
        new Notice("Vault locked & Auto-encryption disabled");
      }
    });

    console.log("Markdown Password Loaded");
  }

  onunload() {
    this.core.lock();
  }

  promptUnlock() {
    new UnlockModal(this.app, this.core, (ok) => {
      if (ok) {
        new Notice("Vault unlocked & Auto-encryption enabled");
        this.refresh();
      }
    }).open();
  }

  refresh() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        leaf.view.previewMode?.rerender(true);
      }
    });
  }
}
