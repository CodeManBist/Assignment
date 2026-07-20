// LLM explanation layer.
//
// Deliberately the only file in the backend that talks to an LLM. It is
// called AFTER reconciliation.js has already decided, deterministically,
// what the discrepancies are - this module only explains them in plain
// language. It never sees raw orders/payments and never influences
// matching; it receives already-computed Discrepancy documents as input.
//
// Temperature: 0.2. We want fluent, readable prose, but this is a
// finance-adjacent explanation a real operator might act on - we'd
// rather it be a bit repetitive/plain across similar discrepancies than
// creative. 0 felt overly terse/robotic in testing; anything above ~0.3
// started editorializing (guessing at causes not supported by the data).
// 0.2 is a deliberate middle point, not a default left untouched.

import Groq from "groq-sdk";

export const MODEL = "llama-3.3-70b-versatile";
const TEMPERATURE = 0.2;

let _client = null;
function getClient() {
  if (!_client) {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are explaining order/payment reconciliation discrepancies to a person \
responsible for a store's revenue. You are given discrepancies that a deterministic rules engine \
has ALREADY identified and classified - your job is only to explain them in plain language and \
suggest next steps. Do not question, second-guess, or reclassify the discrepancy_type or \
amount_at_risk you're given; treat them as ground truth.

For each discrepancy, respond with a concise, factual explanation grounded only in the fields \
provided. Do not invent details (e.g. do not guess a specific reason like "the customer's card \
was declined due to insufficient funds" unless that is stated - say "the payment failed" and \
suggest checking the processor for the reason instead).

Respond ONLY with a JSON object of the form {"explanations": [...]}, one entry per discrepancy in \
the same order given, each with exactly these keys: "discrepancy_id" (string, copied from input), \
"summary" (one sentence, what happened), "likely_cause" (one sentence, grounded speculation, or \
null if there isn't a reasonable one), "recommended_action" (one sentence, what someone should do \
next). No prose outside the JSON object.`;

export class LLMExplanationError extends Error {}

function buildUserMessage(discrepancies) {
  const payload = discrepancies.map((d) => ({
    discrepancy_id: d._id.toString(),
    discrepancy_type: d.discrepancyType,
    order_id: d.orderId,
    payment_ref: d.paymentRef,
    order_amount: d.orderAmount,
    payment_amount: d.paymentAmount,
    amount_at_risk: d.amountAtRisk,
    severity: d.severity,
    rule_details: d.details,
  }));
  return JSON.stringify(payload, null, 2);
}

// Returns a list of {discrepancy_id, summary, likely_cause,
// recommended_action} in the same order as the input. Throws
// LLMExplanationError on anything that can't be recovered from - callers
// are expected to turn that into a clean 502 rather than a silent
// partial result, per the assignment's "handle it when the LLM
// misbehaves" requirement.
export async function explainDiscrepancies(discrepancies) {
  if (discrepancies.length === 0) return [];

  const client = getClient();
  let response;
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(discrepancies) },
      ],
    });
  } catch (err) {
    throw new LLMExplanationError(`LLM request failed: ${err.message}`);
  }

  const text = response.choices?.[0]?.message?.content?.trim() || "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new LLMExplanationError("LLM did not return valid JSON");
  }

  const list = Array.isArray(parsed) ? parsed : parsed.explanations;
  if (!Array.isArray(list)) {
    throw new LLMExplanationError("LLM response did not contain an explanations array");
  }

  const byId = new Map();
  for (const item of list) {
    if (item && typeof item === "object" && item.discrepancy_id) {
      byId.set(String(item.discrepancy_id), item);
    }
  }

  return discrepancies.map((d) => {
    const id = d._id.toString();
    const item = byId.get(id);
    if (!item) {
      // The model dropped this one - fall back to a rule-based
      // explanation rather than silently omitting it from the response.
      return {
        discrepancy_id: id,
        summary: d.details || `${d.discrepancyType} on order ${d.orderId}.`,
        likely_cause: null,
        recommended_action: "Review manually - automatic explanation unavailable.",
      };
    }
    return {
      discrepancy_id: id,
      summary: String(item.summary || d.details || ""),
      likely_cause: item.likely_cause ?? null,
      recommended_action: item.recommended_action ?? null,
    };
  });
}
