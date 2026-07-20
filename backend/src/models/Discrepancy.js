import mongoose from "mongoose";

const discrepancySchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadBatch", required: true, index: true },

  discrepancyType: { type: String, required: true, index: true },
  orderId: { type: String, index: true },
  paymentRef: { type: String, index: true },

  orderAmount: Number,
  paymentAmount: Number,
  amountAtRisk: { type: Number, required: true, default: 0 },

  severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  details: String, // short human-readable rule explanation (deterministic, not LLM)

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Discrepancy", discrepancySchema);
