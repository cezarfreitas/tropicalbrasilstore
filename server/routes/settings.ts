import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Get store settings
router.get("/", async (req, res) => {
  try {
    const [settings] = await db.execute(`
      SELECT * FROM store_settings ORDER BY id LIMIT 1
    `);

    let storeSettings = (settings as any[])[0];

    // If no settings exist, create default settings
    if (!storeSettings) {
      const defaultSettings = {
        store_name: "Chinelos Store",
        store_description: "Loja especializada em chinelos de alta qualidade",
        contact_email: "contato@chinelos.com",
        contact_phone: "(11) 99999-9999",
        contact_whatsapp: "(11) 99999-9999",
        address: "Rua Principal, 123",
        city: "São Paulo",
        state: "SP",
        postal_code: "01234-567",
        shipping_fee: 15.0,
        free_shipping_threshold: 150.0,
        payment_methods: JSON.stringify(["pix", "credit_card", "debit_card"]),
        social_instagram: "@chinelos",
        social_facebook: "facebook.com/chinelos",
        logo_url: null,
        banner_url: null,
        maintenance_mode: false,
        allow_orders: true,
        tax_rate: 0.0,
      };

      await db.execute(
        `
        INSERT INTO store_settings (
          store_name, store_description, contact_email, contact_phone, 
          contact_whatsapp, address, city, state, postal_code,
          shipping_fee, free_shipping_threshold, payment_methods,
          social_instagram, social_facebook, logo_url, banner_url,
          maintenance_mode, allow_orders, tax_rate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
        [
          defaultSettings.store_name,
          defaultSettings.store_description,
          defaultSettings.contact_email,
          defaultSettings.contact_phone,
          defaultSettings.contact_whatsapp,
          defaultSettings.address,
          defaultSettings.city,
          defaultSettings.state,
          defaultSettings.postal_code,
          defaultSettings.shipping_fee,
          defaultSettings.free_shipping_threshold,
          defaultSettings.payment_methods,
          defaultSettings.social_instagram,
          defaultSettings.social_facebook,
          defaultSettings.logo_url,
          defaultSettings.banner_url,
          defaultSettings.maintenance_mode,
          defaultSettings.allow_orders,
          defaultSettings.tax_rate,
        ],
      );

      const [newSettings] = await db.execute(`
        SELECT * FROM store_settings ORDER BY id LIMIT 1
      `);
      storeSettings = (newSettings as any[])[0];
    }

    // Parse JSON fields
    if (storeSettings.payment_methods) {
      try {
        storeSettings.payment_methods = JSON.parse(
          storeSettings.payment_methods,
        );
      } catch (e) {
        storeSettings.payment_methods = ["pix", "credit_card"];
      }
    }

    res.json(storeSettings);
  } catch (error) {
    console.error("Error fetching store settings:", error);
    res.status(500).json({ error: "Failed to fetch store settings" });
  }
});

// Update store settings
router.patch("/", async (req, res) => {
  try {
    const {
      store_name,
      store_description,
      contact_email,
      contact_phone,
      contact_whatsapp,
      address,
      city,
      state,
      postal_code,
      shipping_fee,
      free_shipping_threshold,
      payment_methods,
      social_instagram,
      social_facebook,
      logo_url,
      banner_url,
      maintenance_mode,
      allow_orders,
      tax_rate,
    } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (store_name !== undefined) {
      updateFields.push("store_name = ?");
      updateValues.push(store_name);
    }
    if (store_description !== undefined) {
      updateFields.push("store_description = ?");
      updateValues.push(store_description);
    }
    if (contact_email !== undefined) {
      updateFields.push("contact_email = ?");
      updateValues.push(contact_email);
    }
    if (contact_phone !== undefined) {
      updateFields.push("contact_phone = ?");
      updateValues.push(contact_phone);
    }
    if (contact_whatsapp !== undefined) {
      updateFields.push("contact_whatsapp = ?");
      updateValues.push(contact_whatsapp);
    }
    if (address !== undefined) {
      updateFields.push("address = ?");
      updateValues.push(address);
    }
    if (city !== undefined) {
      updateFields.push("city = ?");
      updateValues.push(city);
    }
    if (state !== undefined) {
      updateFields.push("state = ?");
      updateValues.push(state);
    }
    if (postal_code !== undefined) {
      updateFields.push("postal_code = ?");
      updateValues.push(postal_code);
    }
    if (shipping_fee !== undefined) {
      updateFields.push("shipping_fee = ?");
      updateValues.push(shipping_fee);
    }
    if (free_shipping_threshold !== undefined) {
      updateFields.push("free_shipping_threshold = ?");
      updateValues.push(free_shipping_threshold);
    }
    if (payment_methods !== undefined) {
      updateFields.push("payment_methods = ?");
      updateValues.push(JSON.stringify(payment_methods));
    }
    if (social_instagram !== undefined) {
      updateFields.push("social_instagram = ?");
      updateValues.push(social_instagram);
    }
    if (social_facebook !== undefined) {
      updateFields.push("social_facebook = ?");
      updateValues.push(social_facebook);
    }
    if (logo_url !== undefined) {
      updateFields.push("logo_url = ?");
      updateValues.push(logo_url);
    }
    if (banner_url !== undefined) {
      updateFields.push("banner_url = ?");
      updateValues.push(banner_url);
    }
    if (maintenance_mode !== undefined) {
      updateFields.push("maintenance_mode = ?");
      updateValues.push(maintenance_mode);
    }
    if (allow_orders !== undefined) {
      updateFields.push("allow_orders = ?");
      updateValues.push(allow_orders);
    }
    if (tax_rate !== undefined) {
      updateFields.push("tax_rate = ?");
      updateValues.push(tax_rate);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateFields.push("updated_at = NOW()");

    await db.execute(
      `
      UPDATE store_settings 
      SET ${updateFields.join(", ")}
      ORDER BY id LIMIT 1
    `,
      updateValues,
    );

    res.json({ message: "Store settings updated successfully" });
  } catch (error) {
    console.error("Error updating store settings:", error);
    res.status(500).json({ error: "Failed to update store settings" });
  }
});

export { router as settingsRouter };
