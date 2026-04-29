export type NoteType =
  | "course"
  | "call"
  | "meeting"
  | "idea"
  | "journal"
  | "task_review"
  | "feedback"
  | "general";

export interface NoteTemplate {
  label: string;
  signals: string;
  sections: string[];
  notionDatabaseKey?: string;
  sectionGuidance?: Record<string, string>;
}

export const NOTE_TEMPLATES: Record<NoteType, NoteTemplate> = {
  course: {
    label: "Course / Learning",
    signals: "learning, class, lesson, lecture, course, tutorial, chapter, studying, module",
    sections: [
      "## Summary",
      "## Key learning points",
      "## Concepts to revisit",
      "## Actionable next steps",
    ],
    notionDatabaseKey: "learning",
    sectionGuidance: {
      "## Key learning points":
        "Extract distinct concepts, not just rephrased sentences from the transcript.",
      "## Concepts to revisit":
        "Flag anything the speaker seemed uncertain about or said they'd look up later.",
    },
  },
  call: {
    label: "Call",
    signals: "call, spoke with, talked to, phone, spoke to, conversation with",
    sections: [
      "## Summary",
      "## Decisions made",
      "## Action items",
      "## Things to remember for next time",
    ],
    notionDatabaseKey: "calls",
    sectionGuidance: {
      "## Things to remember for next time":
        "Interpersonal or contextual notes: tone, preferences, history mentioned.",
    },
  },
  meeting: {
    label: "Meeting",
    signals: "meeting, standup, sync, retro, review, session, workshop",
    sections: [
      "## Summary",
      "## Key discussion points",
      "## Decisions made",
      "## Action items",
      "## Open questions",
    ],
    notionDatabaseKey: "meetings",
  },
  idea: {
    label: "Idea / Brainstorm",
    signals: "idea, what if, thinking about, exploring, concept, brainstorm",
    sections: [
      "## Summary",
      "## Core idea",
      "## Potential next steps",
      "## Risks or unknowns",
    ],
  },
  journal: {
    label: "Journal / Reflection",
    signals: "feeling, today, reflecting, grateful, thinking, personal",
    sections: ["## Summary", "## Key reflections", "## Takeaways"],
    notionDatabaseKey: "journal",
  },
  task_review: {
    label: "Task Review",
    signals: "tasks, to-do, todo, things to do, need to, should, checklist",
    sections: ["## Summary", "## Tasks", "## Priorities"],
    sectionGuidance: {
      "## Tasks": "Format as a checklist: '- [ ] task description'. One task per bullet.",
      "## Priorities": "Order by urgency/importance. Call out any blockers.",
    },
  },
  feedback: {
    label: "Feedback Session",
    signals:
      "feedback, review, critique, comments on, thoughts on, looking at, design review, what I think, improvements",
    sections: [
      "## Summary",
      "## What's working",
      "## Issues and improvements",
      "## Decisions or direction changes",
      "## Next actions",
    ],
    sectionGuidance: {
      "## Issues and improvements":
        "Group by area when possible (layout, typography, interaction, copy, code). For each issue, include the suggested fix if one was mentioned.",
      "## Decisions or direction changes":
        "Only include things that represent a shift from the previous direction - not observations or opinions.",
      "## Next actions": "Format as '- [ ] action - owner if mentioned'. One per bullet.",
    },
  },
  general: {
    label: "General Note",
    signals: "fallback when nothing else matches",
    sections: ["## Summary", "## Key points", "## Action items"],
  },
};

export const NOTION_DATABASE_MAP: Record<string, string> = {
  learning: process.env.NOTION_DATABASE_LEARNING ?? "",
  calls: process.env.NOTION_DATABASE_CALLS ?? "",
  meetings: process.env.NOTION_DATABASE_MEETINGS ?? "",
  journal: process.env.NOTION_DATABASE_JOURNAL ?? "",
};

export function getNotionDatabaseId(type: NoteType): string {
  const template = NOTE_TEMPLATES[type];
  const key = template?.notionDatabaseKey;
  const mapped = key ? NOTION_DATABASE_MAP[key] : "";
  return mapped || process.env.NOTION_DATABASE_ID || "";
}
