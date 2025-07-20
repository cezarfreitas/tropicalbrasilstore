import { Router } from "express";
import {
  getAllNotificationSettings,
  updateNotificationSetting,
  getNotificationSetting,
} from "../lib/notification-settings";

const router = Router();

// Get all notification settings
router.get("/", async (req, res) => {
  try {
    const settings = await getAllNotificationSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error getting notification settings:", error);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// Update multiple settings
router.post("/", async (req, res) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "Invalid settings data" });
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string") {
        await updateNotificationSetting(key, value);
      }
    }

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Get specific setting
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const value = await getNotificationSetting(key);

    if (value === null) {
      return res.status(404).json({ error: "Setting not found" });
    }

    res.json({ key, value });
  } catch (error) {
    console.error(`Error getting setting ${req.params.key}:`, error);
    res.status(500).json({ error: "Failed to get setting" });
  }
});

// Update specific setting
router.put("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (typeof value !== "string") {
      return res.status(400).json({ error: "Value must be a string" });
    }

    await updateNotificationSetting(key, value);
    res.json({ message: "Setting updated successfully" });
  } catch (error) {
    console.error(`Error updating setting ${req.params.key}:`, error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// Test email configuration
router.post("/test-email", async (req, res) => {
  try {
    const { sendEmailNotification } = await import(
      "../lib/notification-service"
    );

    // Test data
    const testData = {
      orderId: "TEST-" + Date.now(),
      customerName: "Cliente Teste",
      customerEmail: "teste@email.com",
      customerWhatsapp: "(11) 99999-9999",
      items: [
        {
          product_name: "Produto Teste",
          color_name: "Cor Teste",
          grade_name: "Grade Teste",
          quantity: 1,
          price: 29.9,
        },
      ],
      totalPrice: 29.9,
      orderDate: new Date().toISOString(),
      status: "pending",
    };

    const success = await sendEmailNotification(testData);

    if (success) {
      res.json({ message: "Test email sent successfully" });
    } else {
      res.status(400).json({ error: "Failed to send test email" });
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ error: "Error sending test email" });
  }
});

// Test webhook configuration
router.post("/test-webhook", async (req, res) => {
  try {
    const { sendWebhookNotification } = await import(
      "../lib/notification-service"
    );

    // Test data
    const testData = {
      orderId: "TEST-" + Date.now(),
      customerName: "Cliente Teste",
      customerEmail: "teste@email.com",
      customerWhatsapp: "(11) 99999-9999",
      items: [
        {
          product_name: "Produto Teste",
          color_name: "Cor Teste",
          grade_name: "Grade Teste",
          quantity: 1,
          price: 29.9,
        },
      ],
      totalPrice: 29.9,
      orderDate: new Date().toISOString(),
      status: "pending",
    };

    const success = await sendWebhookNotification(testData);

    if (success) {
      res.json({ message: "Test webhook sent successfully" });
    } else {
      res.status(400).json({ error: "Failed to send test webhook" });
    }
  } catch (error) {
    console.error("Error sending test webhook:", error);
    res.status(500).json({ error: "Error sending test webhook" });
  }
});

export { router as notificationsRouter };
