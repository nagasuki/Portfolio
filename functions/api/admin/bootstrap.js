import { json, readPortfolio, requireAdmin } from "../_lib/portfolio.js";

export async function onRequestGet(context) {
  const unauthorized = await requireAdmin(context.request, context.env);
  if (unauthorized) {
    return unauthorized;
  }

  const data = await readPortfolio(context.env);
  return json(data);
}
