import { Router } from "express";
import db from "../lib/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    console.log("🔍 Verificando vendedores...");
    
    // Check vendors
    const [vendors] = await db.execute("SELECT id, name, email FROM vendors WHERE active = 1");
    console.log("Vendedores encontrados:", (vendors as any[]).length);

    console.log("\n🔍 Verificando clientes...");
    
    // Check customers
    const [customers] = await db.execute("SELECT id, name, email, vendor_id FROM customers");
    console.log("Clientes encontrados:", (customers as any[]).length);
    
    const assignedCustomers = (customers as any[]).filter(c => c.vendor_id);
    const unassignedCustomers = (customers as any[]).filter(c => !c.vendor_id);
    
    console.log(`  - Com vendedor: ${assignedCustomers.length}`);
    console.log(`  - Sem vendedor: ${unassignedCustomers.length}`);

    // If no customers are assigned, assign some for testing
    if (assignedCustomers.length === 0 && unassignedCustomers.length > 0) {
      console.log("\n🔧 Atribuindo clientes para teste...");
      
      const vendorId = (vendors as any[])[0]?.id;
      if (vendorId && unassignedCustomers.length > 0) {
        for (let i = 0; i < Math.min(3, unassignedCustomers.length); i++) {
          const customer = unassignedCustomers[i];
          await db.execute(
            "UPDATE customers SET vendor_id = ?, vendor_assigned_at = NOW(), vendor_assigned_by = 'test_assignment' WHERE id = ?",
            [vendorId, customer.id]
          );
          console.log(`  ✅ ${customer.name} atribuído ao vendedor ${(vendors as any[])[0].name}`);
        }
      }
    }

    // Final check
    const [finalCustomers] = await db.execute("SELECT COUNT(*) as total FROM customers WHERE vendor_id IS NOT NULL");
    
    res.json({
      success: true,
      vendors: vendors,
      totalCustomers: (customers as any[]).length,
      assignedCustomers: assignedCustomers.length,
      unassignedCustomers: unassignedCustomers.length,
      finalAssignedCount: (finalCustomers as any[])[0].total
    });

  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
