# Technical Specification: Obsidian Markdown Password Standard (v1.0)

## 1. Vision & Core Philosophy

**Markdown Password** is designed to solve the inherent conflict between plain-text note-taking and sensitive data security. It advocates for a decoupled architecture where Markdown files contain only identifiers, while actual secrets are managed in a secure, local-only sidecar.

### Core Objectives:
*   **AI Isolation**: Prevent Large Language Models (LLMs) from indexing or processing sensitive credentials during note analysis.
*   **Cloud-Safe Sync**: Ensure that secrets are never leaked to cloud providers (iCloud, Dropbox, Obsidian Sync) even if Markdown files are synchronized.
*   **Zero-Persistence Security**: Maintain the highest security posture by keeping decryption keys exclusively in volatile memory (RAM).
*   **Transparency & Auditability**: Provide a clear audit trail for any modifications to sensitive data.

---

## 2. Technical Architecture

### 2.1 Data Decoupling Model
The system splits data into two distinct layers:
1.  **Content Layer (Markdown)**: Uses the syntax `[|vault:v_id|]`. This layer is safe for public/cloud storage.
2.  **Vault Layer (JSON)**: A local sidecar file (`vault.json`) containing encrypted payloads mapped to IDs.

### 2.2 Security Model (Zero-Persistence)
*   **Master Key**: User-defined password. Never stored on disk.
*   **Vault Key**: Derived from the Master Key. Stays in RAM and is wiped immediately upon locking or closing the application.
*   **Encryption**: AES-256-GCM (Authenticated Encryption) ensures both confidentiality and integrity of the secrets.
*   **Key Derivation**: PBKDF2 with 100,000 iterations and SHA-256 salt to prevent brute-force attacks.

---

## 3. Standardized Syntax

The project提倡 (advocates) the following syntax for universal secret embedding:
*   **Auto-Conversion**: `[| secret_text |]` -> The plugin automatically encrypts this and replaces it with a vault ID.
*   **Permanent ID**: `[|vault:v_xyz123|]` -> A reference to an entry in the local vault.

---

## 4. Privacy Features

### 4.1 LLM/AI Protection
When an AI agent (like Obsidian Copilot or external LLMs) reads a Markdown file, it only sees the `[|vault:id|]` tokens. Without the local `vault.json` and the Master Key, the AI cannot gain access to the credentials, maintaining a strict privacy boundary.

### 4.2 Audit Logging
All "Secret Editing" operations are logged internally. This ensures that while secrets are hidden, the *history* of who (or what process) modified the vault is preserved for security auditing purposes.

---

## 5. Data Schema (`vault.json`)

```json
{
  "version": "1.0.0",
  "metadata": {
    "salt": "base64_salt",
    "iterations": 100000,
    "verificationToken": { "iv": "...", "data": "..." }
  },
  "secrets": {
    "v_abc123": {
        "iv": "base64_iv",
        "data": "base64_ciphertext",
        "label": "Audit/Label info"
    }
  }
}
```

---

## 6. Implementation Notes for AI Agents
When assisting with this codebase, AI agents must:
*   Maintain the separation between `VaultCore` (logic) and `ViewComponents` (UI).
*   Ensure all cryptographic operations occur within the browser's `SubtleCrypto` API.
*   Respect the "Zero-Persistence" rule: Never suggest storing the Master Key in `localStorage` or `data.json`.
