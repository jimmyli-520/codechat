import { personaOptions, type PersonaOption } from "../../store/modeSlice";

type ModeSwitcherProps = {
  disabled: boolean;
  selectedPersona: PersonaOption["id"];
  onChange: (persona: PersonaOption["id"]) => void;
};

export function ModeSwitcher({ disabled, selectedPersona, onChange }: ModeSwitcherProps) {
  return (
    <label className="chat-control">
      <span>Mode</span>
      <select
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as PersonaOption["id"])}
        value={selectedPersona}
      >
        {personaOptions.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.label}
          </option>
        ))}
      </select>
    </label>
  );
}
