import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get vendor info by referral ID (public endpoint)
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const vendorId = parseInt(req.params.vendorId);

    if (!vendorId || isNaN(vendorId)) {
      return res.status(400).json({ error: "ID do vendedor inválido" });
    }

    // Get vendor information
    const [vendors] = await db.execute(
      "SELECT id, name, email, avatar_url, bio FROM vendors WHERE id = ? AND active = 1",
      [vendorId]
    );

    if ((vendors as any[]).length === 0) {
      return res.status(404).json({ error: "Vendedor não encontrado ou inativo" });
    }

    const vendor = (vendors as any[])[0];

    res.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        avatar_url: vendor.avatar_url,
        bio: vendor.bio
      }
    });

  } catch (error) {
    console.error("Error fetching vendor info:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Get vendor referral statistics (for vendor dashboard)
router.get("/stats/:vendorId", async (req, res) => {
  try {
    const vendorId = parseInt(req.params.vendorId);

    if (!vendorId || isNaN(vendorId)) {
      return res.status(400).json({ error: "ID do vendedor inválido" });
    }

    // Get referral statistics
    const [totalReferrals] = await db.execute(
      "SELECT COUNT(*) as total FROM customers WHERE vendor_id = ? AND vendor_assigned_by = 'auto_referral'",
      [vendorId]
    );

    const [monthlyReferrals] = await db.execute(
      `SELECT COUNT(*) as total FROM customers 
       WHERE vendor_id = ? AND vendor_assigned_by = 'auto_referral' 
       AND MONTH(vendor_assigned_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(vendor_assigned_at) = YEAR(CURRENT_DATE())`,
      [vendorId]
    );

    const [recentReferrals] = await db.execute(
      `SELECT name, email, vendor_assigned_at 
       FROM customers 
       WHERE vendor_id = ? AND vendor_assigned_by = 'auto_referral'
       ORDER BY vendor_assigned_at DESC
       LIMIT 10`,
      [vendorId]
    );

    res.json({
      totalReferrals: (totalReferrals as any[])[0].total,
      monthlyReferrals: (monthlyReferrals as any[])[0].total,
      recentReferrals: recentReferrals
    });

  } catch (error) {
    console.error("Error fetching referral stats:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
