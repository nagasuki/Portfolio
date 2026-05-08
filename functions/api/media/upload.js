import { json, requireAdmin } from "../_lib/portfolio.js";

export async function onRequestPost(context) {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }

  const formData = await context.request.formData();
  const file = formData.get("file");
  const key = String(formData.get("key") || "").trim();

  if (!(file instanceof File) || !key) {
    return json({ error: "Both file and key are required" }, { status: 400 });
  }

  await context.env.MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream"
    }
  });

  return json({
    ok: true,
    key,
    url: `${context.env.ASSET_BASE_URL || ""}${key}`
  });
}
