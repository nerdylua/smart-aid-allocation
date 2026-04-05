export const caseTemplates = [
  {
    id: "medical_emergency",
    label: "Medical Emergency",
    defaults: {
      title: "Medical emergency: ",
      needs: [{ type: "medical" }],
      language: "hi",
    },
  },
  {
    id: "food_distribution",
    label: "Food / Ration Need",
    defaults: {
      title: "Food assistance needed: ",
      needs: [{ type: "food" }],
    },
  },
  {
    id: "shelter_request",
    label: "Shelter / Housing",
    defaults: {
      title: "Shelter needed: ",
      needs: [{ type: "shelter" }],
    },
  },
  {
    id: "elder_care",
    label: "Elder Care",
    defaults: {
      title: "Elder care needed: ",
      needs: [{ type: "medical" }, { type: "supplies" }],
      language: "hi",
    },
  },
  {
    id: "water_sanitation",
    label: "Water / Sanitation",
    defaults: {
      title: "Water/sanitation issue: ",
      needs: [{ type: "water" }, { type: "sanitation" }],
    },
  },
  {
    id: "child_education",
    label: "Child Education",
    defaults: {
      title: "Education support needed: ",
      needs: [{ type: "education" }],
    },
  },
  {
    id: "flood_response",
    label: "Flood Response",
    defaults: {
      title: "Flood-affected family: ",
      needs: [{ type: "shelter" }, { type: "food" }, { type: "supplies" }],
    },
  },
] as const;

export type CaseTemplate = (typeof caseTemplates)[number];
