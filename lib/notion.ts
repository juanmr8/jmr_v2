const NOTION_API_URL = "https://api.notion.com/v1/pages";
const NOTION_VERSION = "2022-06-28";
const DEFAULT_TITLE_PROPERTY_NAME = "Name";
const DEFAULT_DATE_PROPERTY_NAME = "Date";
const MAX_RICH_TEXT_LENGTH = 2000;
const MAX_CHILDREN_BLOCKS = 100;

function chunkText(text: string, size: number): string[] {
  if (!text) return [];

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

function markdownToParagraphBlocks(markdown: string): Array<Record<string, unknown>> {
  const normalizedMarkdown = (markdown || "").trim();
  if (!normalizedMarkdown) return [];

  const lines = normalizedMarkdown.split("\n");
  const blocks: Array<Record<string, unknown>> = [];

  for (const line of lines) {
    const safeLine = line.length > 0 ? line : " ";
    const textChunks = chunkText(safeLine, MAX_RICH_TEXT_LENGTH);

    for (const textChunk of textChunks) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: {
                content: textChunk,
              },
            },
          ],
        },
      });
    }
  }

  return blocks.slice(0, MAX_CHILDREN_BLOCKS);
}

export async function savePocketNoteToNotion({
  title,
  createdAt,
  markdown,
}: {
  title: string;
  createdAt: string;
  markdown: string;
}): Promise<Record<string, unknown>> {
  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;
  const titlePropertyName =
    process.env.NOTION_TITLE_PROPERTY_NAME || DEFAULT_TITLE_PROPERTY_NAME;
  const datePropertyName = process.env.NOTION_DATE_PROPERTY_NAME || DEFAULT_DATE_PROPERTY_NAME;

  if (!notionToken || !notionDatabaseId) {
    throw new Error("Missing NOTION_TOKEN or NOTION_DATABASE_ID environment variables.");
  }

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
      children: markdownToParagraphBlocks(markdown),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion API request failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as Record<string, unknown>;
}
