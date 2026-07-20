import mongoose from "mongoose";

// Cached LLM output for a discrepancy, kept as its own collection rather
// than fields on Discrepancy so it's obvious in the schema that this
// text is generated commentary, not part of the deterministic
// reconciliation result.
const discrepancyExplanationSchema = new mongoose.Schema({
  discrepancyId: { type: mongoose.Schema.Types.ObjectId, ref: "Discrepancy", required: true, unique: true },

  summary: { type: String, required: true },
  likelyCause: String,
  recommendedAction: String,
  model: String,
  generatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("DiscrepancyExplanation", discrepancyExplanationSchema);
