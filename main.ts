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
      id: "show-password",
      name: "Show Password",
      callback: () => this.promptUnlock()
    });

    this.addCommand({
      id: "hide-password",
      name: "Hide Password",
      callback: () => {
        this.core.lock();
        this.refresh();
        new Notice("Passwords hidden");
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
        new Notice("Passwords revealed");
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
