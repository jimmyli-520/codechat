export type PersonaOption = {
  id: "code-reviewer" | "code-teacher" | "code-generator";
  label: string;
};

export const personaOptions: PersonaOption[] = [
  {
    id: "code-reviewer",
    label: "Code Reviewer"
  },
  {
    id: "code-teacher",
    label: "Code Teacher"
  },
  {
    id: "code-generator",
    label: "Code Generator"
  }
];
