import { Router } from "express";
import Discrepancy from "../models/Discrepancy.js";
import DiscrepancyExplanation from "../models/DiscrepancyExplanation.js";
import { requireAuth } from "../middleware/auth.js";
import { getOwnedBatch } from "./batches.js";
import { explainDiscrepancies, LLMExplanationError, MODEL } from "../services/llm.js";

const router = Router();
router.use(requireAuth);

router.post("/:batchId/explain", async (req, res) => {
  const batch = await getOwnedBatch(req.params.batchId, req.userId);
  if (!batch) return res.status(404).json({ detail: "Batch not found" });

  const ids = req.body?.discrepancy_ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 25) {
    return res.status(422).json({ detail: "discrepancy_ids must be an array of 1-25 ids" });
  }

  const discrepancies = await Discrepancy.find({ _id: { $in: ids }, batchId: batch._id });
  if (discrepancies.length === 0) {
    return res.status(404).json({ detail: "No matching discrepancies found for this batch" });
  }
  const foundIds = new Set(discrepancies.map((d) => d._id.toString()));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return res.status(404).json({ detail: `Discrepancy ids not found in this batch: ${missing.join(", ")}` });
  }

  // Serve cached explanations where we have them; only call the LLM for
  // the ones we don't. Keeps repeated dashboard visits cheap and fast,
  // and keeps results stable (re-opening a discrepancy doesn't reroll it).
  const cachedDocs = await DiscrepancyExplanation.find({ discrepancyId: { $in: [...foundIds] } });
  const cached = new Map(cachedDocs.map((e) => [e.discrepancyId.toString(), e]));
  const toGenerate = discrepancies.filter((d) => !cached.has(d._id.toString()));

  if (toGenerate.length > 0) {
    let generated;
    try {
      generated = await explainDiscrepancies(toGenerate);
    } catch (err) {
      if (err instanceof LLMExplanationError) {
        return res.status(502).json({ detail: `Explanation service unavailable: ${err.message}` });
      }
      throw err;
    }

    for (const item of generated) {
      const record = await DiscrepancyExplanation.create({
        discrepancyId: item.discrepancy_id,
        summary: item.summary,
        likelyCause: item.likely_cause,
        recommendedAction: item.recommended_action,
        model: MODEL,
      });
      cached.set(item.discrepancy_id, record);
    }
  }

  res.json(
    discrepancies.map((d) => {
      const e = cached.get(d._id.toString());
      return {
        discrepancy_id: d._id,
        summary: e.summary,
        likely_cause: e.likelyCause,
        recommended_action: e.recommendedAction,
        model: e.model,
      };
    })
  );
});

export default router;
