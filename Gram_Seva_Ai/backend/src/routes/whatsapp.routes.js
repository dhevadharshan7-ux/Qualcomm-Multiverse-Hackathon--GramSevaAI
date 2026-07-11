/**
 * WhatsApp Webhook Routes — /api/whatsapp
 *
 * ARCHITECTURE:
 *   Citizen → WhatsApp → Webhook → Controller → AI → Service → Repository → Database → Reply
 *
 * Only responds to inbound messages. No unsolicited messages sent.
 * Webhook verification follows Meta's standard GET challenge.
 */

const express = require('express');
const router = express.Router();
const config = require('../config/env');
const aiService = require('../services/ai.service');
const { buildWhatsAppPrompt } = require('../ai/prompt.service');
const logger = require('../config/logger');
const res_utils = require('../helpers/response');

// ─── Webhook Verification (Meta Platform) ───────────────────────────────────

/**
 * GET /api/whatsapp/webhook
 * Meta sends this to verify the webhook URL.
 * Returns the hub.challenge if verify_token matches.
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
    logger.info('WhatsApp webhook verified successfully.');
    return res.status(200).send(challenge);
  }

  logger.warn('WhatsApp webhook verification failed.', { mode, token });
  return res.status(403).json(res_utils.error('Webhook verification failed.'));
});

// ─── Inbound Message Handler ─────────────────────────────────────────────────

/**
 * POST /api/whatsapp/webhook
 * Receives inbound messages from Meta WhatsApp Business API.
 * Processes them through AI and sends a reply.
 *
 * NOTE: Actual reply sending requires WHATSAPP_ACCESS_TOKEN to be configured.
 */
router.post('/webhook', async (req, res) => {
  // Acknowledge receipt immediately (Meta requires 200 within 5 seconds)
  res.status(200).json({ status: 'received' });

  try {
    const body = req.body;

    // Validate it's a WhatsApp event
    if (body.object !== 'whatsapp_business_account') return;

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== 'text') {
      logger.info('WhatsApp: Received non-text message or system event. Skipping.');
      return;
    }

    const fromPhone = message.from;
    const userText = message.text?.body;

    logger.info('WhatsApp: Inbound message received', { from: fromPhone });

    // Build a WhatsApp-optimised prompt and get AI response
    const prompt = buildWhatsAppPrompt(userText);
    const { response } = await aiService.chat(prompt, { model: 'claude' });

    // Send reply via WhatsApp Business API (only if token is configured)
    if (config.whatsappAccessToken && config.whatsappPhoneNumberId) {
      await sendWhatsAppReply(fromPhone, response);
    } else {
      logger.warn('WhatsApp reply not sent — WHATSAPP_ACCESS_TOKEN not configured.', {
        aiResponse: response,
      });
    }
  } catch (err) {
    logger.error('WhatsApp webhook processing error', { error: err.message });
  }
});

// ─── Helper: Send WhatsApp Reply ─────────────────────────────────────────────

async function sendWhatsAppReply(to, text) {
  const url = `https://graph.facebook.com/v18.0/${config.whatsappPhoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };

  // Use dynamic import to avoid bundling issues
  const https = require('https');
  const postData = JSON.stringify(payload);

  const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/${config.whatsappPhoneNumberId}/messages`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.whatsappAccessToken}`,
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        logger.info('WhatsApp reply sent', { to, status: res.statusCode });
        resolve(JSON.parse(data));
      });
    });
    req.on('error', (err) => {
      logger.error('WhatsApp reply failed', { error: err.message });
      reject(err);
    });
    req.write(postData);
    req.end();
  });
}

// ─── Health Check ────────────────────────────────────────────────────────────

router.get('/status', (req, res) => {
  return res.json(
    res_utils.success('WhatsApp webhook is active', {
      configured: Boolean(config.whatsappAccessToken),
      phoneNumberId: config.whatsappPhoneNumberId || 'Not configured',
    })
  );
});

module.exports = router;
