import db from "./db";

/**
 * Atribui automaticamente um pedido ao vendedor padrão do cliente
 * @param orderId ID do pedido
 * @param customerEmail Email do cliente
 * @returns Promise<boolean> - true se atribuído com sucesso
 */
export async function autoAssignOrderToVendor(orderId: number, customerEmail: string): Promise<boolean> {
  try {
    // Buscar vendedor padrão do cliente
    const [customerData] = await db.execute(`
      SELECT c.vendor_id, v.name as vendor_name, v.active
      FROM customers c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      WHERE c.email = ? AND c.vendor_id IS NOT NULL AND v.active = 1
    `, [customerEmail]);

    if ((customerData as any[]).length === 0) {
      // Cliente não tem vendedor atribuído ou vendedor está inativo
      return false;
    }

    const vendorData = (customerData as any[])[0];

    // Atribuir pedido ao vendedor do cliente
    await db.execute(`
      UPDATE orders 
      SET vendor_id = ?, 
          assigned_at = NOW(), 
          assigned_by = 'Auto-assignment (Customer Default Vendor)'
      WHERE id = ?
    `, [vendorData.vendor_id, orderId]);

    console.log(`📋 Pedido ${orderId} auto-atribuído ao vendedor ${vendorData.vendor_name} (vendedor padrão do cliente)`);

    // Calcular e registrar comissão
    await calculateAndRecordCommission(orderId, vendorData.vendor_id);

    return true;

  } catch (error) {
    console.error(`❌ Erro ao auto-atribuir pedido ${orderId}:`, error);
    return false;
  }
}

/**
 * Calcula e registra a comissão do vendedor para um pedido
 * @param orderId ID do pedido
 * @param vendorId ID do vendedor
 */
export async function calculateAndRecordCommission(orderId: number, vendorId: number): Promise<void> {
  try {
    // Buscar dados do pedido e vendedor
    const [orderData] = await db.execute(`
      SELECT o.total_amount, v.commission_percentage
      FROM orders o
      INNER JOIN vendors v ON v.id = ?
      WHERE o.id = ?
    `, [vendorId, orderId]);

    if ((orderData as any[]).length === 0) {
      throw new Error("Order or vendor not found");
    }

    const { total_amount, commission_percentage } = (orderData as any[])[0];
    const commissionAmount = (total_amount * commission_percentage) / 100;

    // Verificar se comissão já foi registrada
    const [existingCommission] = await db.execute(`
      SELECT id FROM vendor_commissions 
      WHERE order_id = ? AND vendor_id = ?
    `, [orderId, vendorId]);

    if ((existingCommission as any[]).length > 0) {
      // Atualizar comissão existente
      await db.execute(`
        UPDATE vendor_commissions 
        SET order_total = ?, 
            commission_percentage = ?, 
            commission_amount = ?,
            updated_at = NOW()
        WHERE order_id = ? AND vendor_id = ?
      `, [total_amount, commission_percentage, commissionAmount, orderId, vendorId]);
    } else {
      // Criar nova entrada de comissão
      await db.execute(`
        INSERT INTO vendor_commissions 
        (vendor_id, order_id, order_total, commission_percentage, commission_amount, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `, [vendorId, orderId, total_amount, commission_percentage, commissionAmount]);
    }

    console.log(`💰 Comissão calculada: R$ ${commissionAmount.toFixed(2)} (${commission_percentage}% de R$ ${total_amount})`);

  } catch (error) {
    console.error("❌ Erro ao calcular comissão:", error);
    throw error;
  }
}

/**
 * Atribui manualmente um pedido a um vendedor
 * @param orderId ID do pedido
 * @param vendorId ID do vendedor
 * @param assignedBy Quem está fazendo a atribuição
 */
export async function assignOrderToVendor(
  orderId: number, 
  vendorId: number, 
  assignedBy: string
): Promise<void> {
  try {
    // Verificar se vendedor está ativo
    const [vendorData] = await db.execute(`
      SELECT id, name, active FROM vendors WHERE id = ?
    `, [vendorId]);

    if ((vendorData as any[]).length === 0) {
      throw new Error("Vendor not found");
    }

    if (!(vendorData as any[])[0].active) {
      throw new Error("Vendor is inactive");
    }

    // Atribuir pedido
    await db.execute(`
      UPDATE orders 
      SET vendor_id = ?, 
          assigned_at = NOW(), 
          assigned_by = ?
      WHERE id = ?
    `, [vendorId, assignedBy, orderId]);

    // Calcular e registrar comissão
    await calculateAndRecordCommission(orderId, vendorId);

    console.log(`📋 Pedido ${orderId} atribuído manualmente ao vendedor ${(vendorData as any[])[0].name}`);

  } catch (error) {
    console.error("❌ Erro ao atribuir pedido:", error);
    throw error;
  }
}

/**
 * Remove a atribuição de um pedido
 * @param orderId ID do pedido
 */
export async function unassignOrderFromVendor(orderId: number): Promise<void> {
  try {
    // Remover atribuição do pedido
    await db.execute(`
      UPDATE orders 
      SET vendor_id = NULL, 
          assigned_at = NULL, 
          assigned_by = NULL
      WHERE id = ?
    `, [orderId]);

    // Marcar comissão como cancelada
    await db.execute(`
      UPDATE vendor_commissions 
      SET status = 'cancelled', 
          updated_at = NOW(),
          notes = CONCAT(COALESCE(notes, ''), 'Order unassigned - Commission cancelled')
      WHERE order_id = ?
    `, [orderId]);

    console.log(`📋 Pedido ${orderId} desatribuído do vendedor`);

  } catch (error) {
    console.error("❌ Erro ao desatribuir pedido:", error);
    throw error;
  }
}
