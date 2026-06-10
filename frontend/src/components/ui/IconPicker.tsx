import { Icon } from "@iconify/react";
import { getIconsForType } from "./CategoryIcon";
import { cn } from "../../lib/cn";
import type { TransactionType } from "../../types";

interface Props {
  value: string;
  onChange: (name: string) => void;
  type: TransactionType;
}

export function IconPicker({ value, onChange, type }: Props) {
  const icons = getIconsForType(type);

  return (
    <div className="grid grid-cols-7 gap-1 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-52 overflow-y-auto">
      {icons.map(({ name, label }) => (
        <button
          key={name}
          type="button"
          title={label}
          onClick={() => onChange(name)}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
            value === name
              ? "bg-indigo-600 ring-2 ring-indigo-400"
              : "bg-white hover:bg-indigo-50 border border-slate-200",
          )}
        >
          <Icon icon={`noto:${name}`} width={20} height={20} />
        </button>
      ))}
    </div>
  );
}
