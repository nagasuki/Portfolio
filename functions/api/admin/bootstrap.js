import { json, readPortfolio, requireAdmin } from "../_lib/portfolio.js";

export async function onRequestGet(context) {
  try {
    const unauthorized = await requireAdmin(context.request, context.env);
    if (unauthorized) {
      return unauthorized;
    }

    const data = await readPortfolio(context.env);
    return json(data);
  } catch (error) {
    return json(
      {
        error: "Failed to load admin bootstrap data",
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
