import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadBatch", required: true, index: true },

  orderId: { type: String, required: true },
  orderIdNormalized: { type: String, required: true, index: true }, // trimmed + uppercased, used for matching
  orderDate: Date,
  customerEmail: String,
  currency: String,
  grossAmount: Number,
  discount: Number,
  netAmount: Number,
  status: String, // completed | cancelled | refunded
});

export default mongoose.model("Order", orderSchema);
