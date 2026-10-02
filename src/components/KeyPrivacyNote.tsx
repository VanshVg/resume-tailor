import { LockIcon } from "./ui/icons";

export function KeyPrivacyNote() {
  return (
    <p className="text-fg-muted flex gap-2 text-xs">
      <LockIcon className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Your key stays in your browser and is sent only to Anthropic. It is never stored on our
        servers. Get one at{" "}
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          console.anthropic.com
        </a>
        .
      </span>
    </p>
  );
}
