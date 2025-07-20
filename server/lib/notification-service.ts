import { getNotificationSetting } from "./notification-settings";
import nodemailer from "nodemailer";

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  items: Array<{
    product_name: string;
    color_name: string;
    grade_name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  orderDate: string;
  status: string;
}

// Replace template variables with actual data
function replaceTemplateVariables(template: string, data: OrderData): string {
  const orderDate = new Date(data.orderDate).toLocaleString('pt-BR');
  const emailDate = new Date().toLocaleString('pt-BR');
  
  // Format items for email template
  const itemsHtml = data.items.map(item => `
    <div class="item">
      <strong>${item.product_name}</strong><br>
      Cor: ${item.color_name} | Grade: ${item.grade_name}<br>
      Quantidade: ${item.quantity} x R$ ${item.price.toFixed(2)} = R$ ${(item.quantity * item.price).toFixed(2)}
    </div>
  `).join('');

  // Format items for JSON (webhook)
  const itemsJson = JSON.stringify(data.items);

  return template
    .replace(/{{ORDER_ID}}/g, data.orderId)
    .replace(/{{CUSTOMER_NAME}}/g, data.customerName)
    .replace(/{{CUSTOMER_EMAIL}}/g, data.customerEmail)
    .replace(/{{CUSTOMER_WHATSAPP}}/g, data.customerWhatsapp)
    .replace(/{{TOTAL_PRICE}}/g, data.totalPrice.toFixed(2))
    .replace(/{{ORDER_DATE}}/g, orderDate)
    .replace(/{{ORDER_STATUS}}/g, data.status)
    .replace(/{{EMAIL_DATE}}/g, emailDate)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{ORDER_ITEMS}}/g, itemsHtml)
    .replace(/{{ORDER_ITEMS_JSON}}/g, itemsJson);
}

// Send email notification
export async function sendEmailNotification(orderData: OrderData): Promise<boolean> {
  try {
    const emailEnabled = await getNotificationSetting('email_enabled');
    if (emailEnabled !== 'true') {
      console.log('📧 Email notifications disabled');
      return false;
    }

    // Get SMTP configuration
    const smtpHost = await getNotificationSetting('smtp_host');
    const smtpPort = await getNotificationSetting('smtp_port');
    const smtpUser = await getNotificationSetting('smtp_user');
    const smtpPassword = await getNotificationSetting('smtp_password');
    const fromEmail = await getNotificationSetting('smtp_from_email');
    const fromName = await getNotificationSetting('smtp_from_name');

    if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
      console.error('❌ Email settings not configured');
      return false;
    }

    // Get email template
    const emailSubject = await getNotificationSetting('email_subject') || 'Novo Pedido';
    const emailTemplate = await getNotificationSetting('email_template') || '';

    // Replace template variables
    const subject = replaceTemplateVariables(emailSubject, orderData);
    const htmlContent = replaceTemplateVariables(emailTemplate, orderData);

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: parseInt(smtpPort || '587'),
      secure: parseInt(smtpPort || '587') === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: fromEmail, // Send to store owner
      subject: subject,
      html: htmlContent,
    });

    console.log('✅ Email notification sent successfully');
    return true;

  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return false;
  }
}

// Send webhook notification
export async function sendWebhookNotification(orderData: OrderData): Promise<boolean> {
  try {
    const webhookEnabled = await getNotificationSetting('webhook_enabled');
    if (webhookEnabled !== 'true') {
      console.log('🔗 Webhook notifications disabled');
      return false;
    }

    const webhookUrl = await getNotificationSetting('webhook_url');
    const webhookMethod = await getNotificationSetting('webhook_method') || 'POST';
    const webhookHeaders = await getNotificationSetting('webhook_headers') || '{}';
    const webhookTemplate = await getNotificationSetting('webhook_template') || '{}';

    if (!webhookUrl) {
      console.error('❌ Webhook URL not configured');
      return false;
    }

    // Replace template variables
    const payload = replaceTemplateVariables(webhookTemplate, orderData);
    
    // Parse headers
    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(webhookHeaders);
    } catch (e) {
      headers = { 'Content-Type': 'application/json' };
    }

    // Send webhook
    const response = await fetch(webhookUrl, {
      method: webhookMethod,
      headers: headers,
      body: payload,
    });

    if (response.ok) {
      console.log('✅ Webhook notification sent successfully');
      return true;
    } else {
      console.error('❌ Webhook failed:', response.status, response.statusText);
      return false;
    }

  } catch (error) {
    console.error('❌ Error sending webhook notification:', error);
    return false;
  }
}

// Send all notifications
export async function sendOrderNotifications(orderData: OrderData): Promise<void> {
  console.log(`📨 Sending notifications for order ${orderData.orderId}`);
  
  // Send both notifications in parallel
  const [emailResult, webhookResult] = await Promise.allSettled([
    sendEmailNotification(orderData),
    sendWebhookNotification(orderData)
  ]);

  if (emailResult.status === 'rejected') {
    console.error('Email notification failed:', emailResult.reason);
  }

  if (webhookResult.status === 'rejected') {
    console.error('Webhook notification failed:', webhookResult.reason);
  }
}
