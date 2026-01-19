import { MarkdownPostProcessorContext } from "obsidian";
import { VaultCore } from "../core/VaultCore";

export class PreviewProcessor {
  constructor(private core: VaultCore) {}

  get processor() {
    return async (el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      const tasks: (() => Promise<void>)[] = [];

      while ((node = walker.nextNode())) {
        const text = node.textContent || "";
        if (text.includes("[|vault:")) {
          const currentNode = node;
          tasks.push(async () => {
            const regex = /\[\|vault:([^|]+)\|\]/g;
            let m;
            const fragment = document.createDocumentFragment();
            let lastIdx = 0;
            let hasMatch = false;

            while ((m = regex.exec(text)) !== null) {
              hasMatch = true;
              fragment.appendText(text.substring(lastIdx, m.index));
              try {
                const secret = await this.core.getSecret(m[1]);
                const span = document.createElement("span");
                span.textContent = secret;
                span.className = "vault-revealed";
                span.onclick = (e) => {
                  e.preventDefault();
                  void navigator.clipboard.writeText(secret);
                  const old = span.textContent;
                  span.textContent = "Copied!";
                  setTimeout(() => span.textContent = old, 1000);
                };
                fragment.appendChild(span);
              } catch {
                const err = document.createElement("span");
                err.textContent = "[|locked|]";
                err.className = "vault-error";
                fragment.appendChild(err);
              }
              lastIdx = m.index + m[0].length;
            }

            if (hasMatch) {
              fragment.appendText(text.substring(lastIdx));
              currentNode.parentNode?.replaceChild(fragment, currentNode);
            }
          });
        }
      }
      for (const t of tasks) await t();
    };
  }
}
