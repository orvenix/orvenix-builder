import { promises as fs } from "node:fs";
import path from "node:path";

const contentFile = path.join(process.cwd(), "data", "content.json");

export async function readSiteContent(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(contentFile, "utf8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeSiteContent(data: Record<string, string>) {
  await fs.mkdir(path.dirname(contentFile), { recursive: true });
  await fs.writeFile(contentFile, JSON.stringify(data, null, 2), "utf8");
}

export async function upsertSiteContent(key: string, value: unknown) {
  const data = await readSiteContent();
  data[String(key)] = String(value);
  await writeSiteContent(data);
}

export async function upsertManySiteContent(changes: Record<string, unknown>) {
  const data = await readSiteContent();
  for (const [key, value] of Object.entries(changes)) {
    data[String(key)] = String(value);
  }
  await writeSiteContent(data);
}

export async function removeSiteContent(key: string) {
  const data = await readSiteContent();
  delete data[key];
  await writeSiteContent(data);
}
