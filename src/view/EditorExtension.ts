import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { VaultCore } from "../core/VaultCore";

// --- Decoration Widget ---
class SecretWidget extends WidgetType {
  constructor(private label: string, private isId: boolean) { super(); }
  toDOM() {
    const span = document.createElement("span");
    span.textContent = "🔒 " + (this.isId ? "Encrypted" : this.label);
    span.className = this.isId ? "vault-revealed" : "vault-typing";
    return span;
  }
}

// --- Plugin Logic ---
export const vaultExtension = (core: VaultCore) => ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  constructor(view: EditorView) { this.decorations = this.build(view); }
  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.build(update.view);
      if (update.docChanged) {
        void this.checkAutoEncrypt(update);
      }
    }
  }

  build(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>();
    const text = view.state.doc.sliceString(0);
    const regex = /\[\|([^|]+)\|\]/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const isId = m[1].startsWith("vault:");
      builder.add(m.index, m.index + m[0].length, Decoration.widget({
        widget: new SecretWidget(m[1], isId),
        side: 1
      }));
    }
    return builder.finish();
  }

  async checkAutoEncrypt(update: ViewUpdate) {
    const text = update.view.state.doc.sliceString(0);
    const regex = /\[\|(?!vault:)([^|]+)\|\]/g;
    let m;
    if ((m = regex.exec(text)) !== null) {
      if (!core.isUnlocked()) return;
      try {
        const id = await core.addSecret(m[1]);
        const newText = `[|vault:${id}|]`;
        update.view.dispatch({
          changes: { from: m.index, to: m.index + m[0].length, insert: newText }
        });
      } catch (e) {
        console.error("Auto-encrypt failed", e);
      }
    }
  }
}, { decorations: v => v.decorations });
