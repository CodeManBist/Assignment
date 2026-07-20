import { Router } from "express";
import multer from "multer";
import UploadBatch from "../models/UploadBatch.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Discrepancy from "../models/Discrepancy.js";
import { requireAuth } from "../middleware/auth.js";
import { parseOrdersCsv, parsePaymentsCsv } from "../services/ingest.js";
import { reconcile } from "../services/reconciliation.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth);

// Shared helper: every batch-scoped route (dashboard, discrepancies,
// explain) must go through this rather than querying UploadBatch
// directly by id - it's what stops user A from viewing user B's data by
// guessing a batch id, since the filter is on userId, not just _id.
export async function getOwnedBatch(batchId, userId) {
  const batch = await UploadBatch.findOne({ _id: batchId, userId });
  return batch; // null if not found or not owned
}

router.post(
  "/upload",
  upload.fields([{ name: "orders_file", maxCount: 1 }, { name: "payments_file", maxCount: 1 }]),
  async (req, res) => {
    const ordersFile = req.files?.orders_file?.[0];
    const paymentsFile = req.files?.payments_file?.[0];

    if (!ordersFile || !ordersFile.originalname.toLowerCase().endsWith(".csv")) {
      return res.status(400).json({ detail: "orders_file must be a .csv file" });
    }
    if (!paymentsFile || !paymentsFile.originalname.toLowerCase().endsWith(".csv")) {
      return res.status(400).json({ detail: "payments_file must be a .csv file" });
    }

    // Doing this synchronously (rather than a background job) is a
    // deliberate scope call for a 24h take-home: these files are small
    // (hundreds of rows), so a queue would add infrastructure without
    // adding real value here. Worth flagging as a "next step" for files
    // at real-world scale.
    const batch = await UploadBatch.create({
      userId: req.userId,
      ordersFilename: ordersFile.originalname,
      paymentsFilename: paymentsFile.originalname,
      status: "processing",
    });

    try {
      const ordersText = ordersFile.buffer.toString("utf-8");
      console.log("orders bytes:", ordersFile.buffer.length, "| first 200 chars:", JSON.stringify(ordersText.slice(0, 200)));
      const paymentsText = paymentsFile.buffer.toString("utf-8");

      const orderRows = parseOrdersCsv(ordersText, batch._id);
      const paymentRows = parsePaymentsCsv(paymentsText, batch._id);

      if (orderRows.length === 0) throw new Error("orders_file has no rows");
      if (paymentRows.length === 0) throw new Error("payments_file has no rows");

      const savedOrders = await Order.insertMany(orderRows);
      const savedPayments = await Payment.insertMany(paymentRows);

      const discrepancyRows = reconcile(batch._id, savedOrders, savedPayments);
      if (discrepancyRows.length > 0) {
        await Discrepancy.insertMany(discrepancyRows);
      }

      batch.status = "reconciled";
      await batch.save();
    } catch (err) {
      batch.status = "failed";
      await batch.save();
      return res.status(422).json({ detail: `Could not process files: ${err.message}` });
    }

    res.json({
      id: batch._id,
      orders_filename: batch.ordersFilename,
      payments_filename: batch.paymentsFilename,
      status: batch.status,
      created_at: batch.createdAt,
    });
  }
);

router.get("/", async (req, res) => {
  const batches = await UploadBatch.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(
    batches.map((b) => ({
      id: b._id,
      orders_filename: b.ordersFilename,
      payments_filename: b.paymentsFilename,
      status: b.status,
      created_at: b.createdAt,
    }))
  );
});

export default router;
