import { isModelId, MODELS, type ModelId } from "../config/models";

interface ModelSelectProps {
  readonly value: ModelId;
  readonly onChange: (value: ModelId) => void;
}

export function ModelSelect({ value, onChange }: ModelSelectProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-900">Model</legend>
      <div className="mt-1 grid gap-2">
        {MODELS.map((model) => (
          <label
            key={model.id}
            className="flex cursor-pointer gap-3 rounded-lg border border-slate-300 bg-white p-3 has-checked:border-indigo-600 has-checked:ring-1 has-checked:ring-indigo-600 has-focus-visible:outline-2 has-focus-visible:outline-indigo-600"
          >
            <input
              type="radio"
              name="model"
              value={model.id}
              checked={value === model.id}
              onChange={(e) => {
                if (isModelId(e.target.value)) onChange(e.target.value);
              }}
              className="mt-1 size-4 accent-indigo-600"
            />
            <span className="text-sm">
              <span className="font-medium text-slate-900">{model.label}</span>
              <span className="block text-slate-600">{model.description}</span>
              <span className="block text-slate-500">{model.costHint}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Costs are billed by Anthropic to your key. Ranges include the model&apos;s thinking time;
        the actual cost is shown after each run.
      </p>
    </fieldset>
  );
}
