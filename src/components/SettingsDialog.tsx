import type { UseApiKey } from "../hooks/useApiKey";
import type { FieldStatus } from "../utils/validateInputs";
import { KeyInput } from "./KeyInput";
import { KeyPrivacyNote } from "./KeyPrivacyNote";
import { Modal } from "./ui/Modal";

interface SettingsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly apiKey: UseApiKey;
  readonly keyStatus: FieldStatus;
}

export function SettingsDialog({ open, onClose, apiKey, keyStatus }: SettingsDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="API key"
      description="Analyses and cover letters are billed by Anthropic to this key."
    >
      <div className="space-y-4">
        <KeyInput value={apiKey.apiKey} onChange={apiKey.setApiKey} status={keyStatus} />
        <label className="text-fg flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={apiKey.remember}
            onChange={(e) => {
              apiKey.setRemember(e.target.checked);
            }}
            className="accent-accent size-4"
          />
          Remember my key on this device
        </label>
        {apiKey.storageFailed && (
          <p className="text-warn-text text-sm">
            This browser blocked local storage, so the key will be forgotten when you close the tab.
          </p>
        )}
        <KeyPrivacyNote />
        <div className="border-line flex justify-between gap-2 border-t pt-4">
          <button
            type="button"
            onClick={() => {
              apiKey.clear();
              onClose();
            }}
            disabled={!apiKey.apiKey}
            className="btn-secondary text-danger-text"
          >
            Remove key
          </button>
          <button type="button" onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
