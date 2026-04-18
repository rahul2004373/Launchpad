import { useState } from "react";
import { Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EnvVar {
  key: string;
  value: string;
  visible: boolean;
}

interface EnvEditorProps {
  initial?: EnvVar[];
  onChange?: (vars: EnvVar[]) => void;
}

export default function EnvEditor({ initial, onChange }: EnvEditorProps) {
  const [vars, setVars] = useState<EnvVar[]>(
    initial || [
      { key: "", value: "", visible: false },
      { key: "", value: "", visible: false },
    ]
  );

  const update = (next: EnvVar[]) => {
    setVars(next);
    onChange?.(next);
  };

  const setKey = (i: number, key: string) => {
    const next = [...vars];
    next[i] = { ...next[i], key };
    update(next);
  };

  const setValue = (i: number, value: string) => {
    const next = [...vars];
    next[i] = { ...next[i], value };
    update(next);
  };

  const toggleVisible = (i: number) => {
    const next = [...vars];
    next[i] = { ...next[i], visible: !next[i].visible };
    update(next);
  };

  const remove = (i: number) => {
    update(vars.filter((_, idx) => idx !== i));
  };

  const add = () => {
    update([...vars, { key: "", value: "", visible: false }]);
  };

  return (
    <div className="space-y-2">
      {vars.map((v, i) => (
        <div key={i} className="flex gap-2 items-center" data-testid={`env-row-${i}`}>
          <Input
            placeholder="KEY"
            value={v.key}
            onChange={(e) => setKey(i, e.target.value)}
            className="font-mono text-xs"
            data-testid={`input-env-key-${i}`}
          />
          <div className="relative flex-1">
            <Input
              placeholder="value"
              type={v.visible ? "text" : "password"}
              value={v.value}
              onChange={(e) => setValue(i, e.target.value)}
              className="font-mono text-xs pr-9"
              data-testid={`input-env-value-${i}`}
            />
            <button
              type="button"
              onClick={() => toggleVisible(i)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-env-toggle-${i}`}
            >
              {v.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            data-testid={`button-env-delete-${i}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={add}
        className="text-muted-foreground hover:text-foreground text-xs gap-1.5 mt-1"
        data-testid="button-env-add"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Variable
      </Button>
    </div>
  );
}
