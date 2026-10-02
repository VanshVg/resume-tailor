import { MailIcon, PenIcon, SparkleIcon, TargetIcon } from "./ui/icons";

const ITEMS = [
  {
    icon: <SparkleIcon />,
    title: "Match score",
    text: "An honest 0–100 fit, and the biggest opportunity.",
  },
  {
    icon: <TargetIcon />,
    title: "Missing keywords",
    text: "Terms from the posting your resume doesn't use yet.",
  },
  {
    icon: <PenIcon />,
    title: "Bullet rewrites",
    text: "Your own bullets, reworded for the role. Nothing invented.",
  },
  {
    icon: <MailIcon />,
    title: "Cover letter",
    text: "A draft built only from what's in your resume.",
  },
];

export function EmptyState() {
  return (
    <div className="border-line rounded-2xl border border-dashed p-6">
      <p className="text-fg-muted text-center text-sm">
        Add your resume and a job description, then press{" "}
        <strong className="text-fg">Analyze</strong>. You&apos;ll get:
      </p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="bg-sunken text-fg-muted grid size-8 shrink-0 place-items-center rounded-lg">
              {item.icon}
            </span>
            <span>
              <span className="text-fg block text-sm font-medium">{item.title}</span>
              <span className="text-fg-muted text-sm">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
