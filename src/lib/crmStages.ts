export const CRM_LEAD_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Nurturing",
  "Won",
  "Client Successfully Acquired",
  "Lost",
] as const;

export const CRM_OPEN_LEAD_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Nurturing",
] as const;

export const CRM_CLOSED_LEAD_STAGES = [
  "Won",
  "Client Successfully Acquired",
  "Lost",
] as const;

export const CRM_CONVERTED_LEAD_STAGES = [
  "Won",
  "Client Successfully Acquired",
] as const;

export type LeadStage = typeof CRM_LEAD_STAGES[number];

export const normalizeLeadStage = (value?: string) =>
  (value || "").trim();

export const normalizeLeadStageKey = (value?: string) =>
  normalizeLeadStage(value).toLowerCase();

export const isLeadStage = (value?: string) =>
  CRM_LEAD_STAGES.some((stage) => normalizeLeadStageKey(stage) === normalizeLeadStageKey(value));

export const isOpenLeadStage = (value?: string) =>
  CRM_OPEN_LEAD_STAGES.some((stage) => normalizeLeadStageKey(stage) === normalizeLeadStageKey(value));

export const isClosedLeadStage = (value?: string) =>
  CRM_CLOSED_LEAD_STAGES.some((stage) => normalizeLeadStageKey(stage) === normalizeLeadStageKey(value));

export const isConvertedLeadStage = (value?: string) =>
  CRM_CONVERTED_LEAD_STAGES.some((stage) => normalizeLeadStageKey(stage) === normalizeLeadStageKey(value));

export const isWonLeadStage = (value?: string) =>
  normalizeLeadStageKey(value) === "won";

export const isLostLeadStage = (value?: string) =>
  normalizeLeadStageKey(value) === "lost";

export const getLeadStageBadgeColor = (stage?: string) => {
  switch (normalizeLeadStageKey(stage)) {
    case "new":
      return "bg-slate-500";
    case "contacted":
      return "bg-blue-500";
    case "negotiation":
      return "bg-yellow-500";
    case "qualified":
      return "bg-purple-500";
    case "won":
      return "bg-green-500";
    case "client successfully acquired":
      return "bg-emerald-500";
    case "lost":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
};
