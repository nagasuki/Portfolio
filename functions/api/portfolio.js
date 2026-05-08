import { json, readPortfolio } from "./_lib/portfolio.js";

export async function onRequestGet(context) {
  try {
    const data = await readPortfolio(context.env);
    return json(data);
  } catch (error) {
    return json(
      {
        error: "Failed to load portfolio data",
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
