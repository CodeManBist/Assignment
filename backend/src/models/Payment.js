import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadBatch", required: true, index: true },

  transactionRef: { type: String, required: true },
  processedAt: Date,
  orderReference: String,
  orderReferenceNormalized: { type: String, index: true },
  currency: String,
  amount: Number,
  fee: Number,
  netSettled: Number,
  type: String,   // charge | refund
  status: String, // settled | pending | failed
});

export default mongoose.model("Payment", paymentSchema);
