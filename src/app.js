const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

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
