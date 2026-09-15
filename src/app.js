const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const env = require('./config/env');
const apiRoutes = require('./routes');
const stripeService = require('./services/stripeService');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

async function asyncStripeWebhook(req, res) {
  try {
    await stripeService.handleWebhookEvent(req.body, req.headers['stripe-signature']);
    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook Stripe:', err.message);
    res.status(400).json({ error: err.message });
  }
}

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP désactivée pour l'instant : la page utilise des polices Google Fonts inline
app.use(
  cors((req, callback) => {
    // Le formulaire de contact / chatbot du site vitrine (autre domaine) doit pouvoir
    // soumettre un lead sans être bloqué par le CORS — le reste de l'API reste restreint.
    const isPublicLeadSubmission = req.path === '/api/leads' && req.method === 'POST';
    callback(null, {
      origin: isPublicLeadSubmission ? true : env.frontendUrl,
      credentials: true,
    });
  })
);
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// Webhook Stripe : DOIT recevoir le body brut (non parsé en JSON) pour vérifier la signature.
// Monté avant express.json() donc jamais impacté par le parseur JSON global ci-dessous.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), asyncStripeWebhook);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

// Sert les assets statiques (logos, etc.) — explicite pour ne pas dépendre du comportement de nginx
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Fallback : sert la page d'aperçu statique pour toute route non-API
// (utile si nginx ne trouve pas de fichier statique et proxy vers Node)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
