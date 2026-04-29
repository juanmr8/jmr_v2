const NOTION_API_URL = "https://api.notion.com/v1/pages";
const NOTION_VERSION = "2026-03-11";
const DEFAULT_TITLE_PROPERTY_NAME = "Name";
const DEFAULT_DATE_PROPERTY_NAME = "Date";
const DEFAULT_MARKDOWN_FALLBACK = "No summary content available.";

export async function savePocketNoteToNotion({
  title,
  createdAt,
  markdown,
  notionDatabaseId,
}: {
  title: string;
  createdAt: string;
  markdown: string;
  notionDatabaseId: string;
}): Promise<Record<string, unknown>> {
  const notionToken = process.env.NOTION_TOKEN;
  const titlePropertyName =
    process.env.NOTION_TITLE_PROPERTY_NAME || DEFAULT_TITLE_PROPERTY_NAME;
  const datePropertyName = process.env.NOTION_DATE_PROPERTY_NAME || DEFAULT_DATE_PROPERTY_NAME;

  if (!notionToken) {
    throw new Error("Missing NOTION_TOKEN environment variable.");
  }

  if (!notionDatabaseId) {
    throw new Error("Missing Notion database ID for pocket note save.");
  }

  const normalizedMarkdown = (markdown || "").trim() || DEFAULT_MARKDOWN_FALLBACK;

  const response = await fetch(NOTION_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: {
        database_id: notionDatabaseId,
      },
      properties: {
        [titlePropertyName]: {
          title: [
            {
              text: {
                content: title || "Untitled recording",
              },
            },
          ],
        },
        [datePropertyName]: {
          date: {
            start: createdAt || new Date().toISOString(),
          },
        },
      },
      markdown: normalizedMarkdown,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion API request failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as Record<string, unknown>;
}
