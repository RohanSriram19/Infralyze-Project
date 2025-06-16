import { NextRequest, NextResponse } from "next/server";
import YAML from "yaml";
import type { InfraData } from "../../../types/infra";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const content = await (file as File).text();

  let parsed: InfraData | null = null;
  let type: "yaml" | "json" | "unknown" = "unknown";
  let parseError: string | null = null;

  try {
    if ((file as File).name.endsWith(".yaml") || (file as File).name.endsWith(".yml")) {
      parsed = YAML.parse(content);
      type = "yaml";
    } else if ((file as File).name.endsWith(".json")) {
      parsed = JSON.parse(content);
      type = "json";
    } else {
      parseError = "Unsupported file type";
    }
  } catch (e: any) {
    parseError = e.message;
  }

  return NextResponse.json({
    name: (file as File).name,
    size: (file as File).size,
    preview: content.slice(0, 500),
    type,
    parsed,
    parseError,
  });
}
