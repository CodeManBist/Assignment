import mongoose from "mongoose";

// One reconciliation "run" for a user: the pair of orders/payments files
// they uploaded, plus everything derived from them. Every Order/Payment/
// Discrepancy document is scoped to a batchId, and every batch is scoped
// to a userId - that's what makes "users only see their own data"
// enforceable at the query level (see middleware/auth.js + routes),
// not just something the UI happens to hide.
const uploadBatchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  ordersFilename: String,
  paymentsFilename: String,
  status: { type: String, enum: ["processing", "reconciled", "failed"], default: "processing" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("UploadBatch", uploadBatchSchema);
