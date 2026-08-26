const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');
const prisma = require('./src/config/db');

const server = app.listen(env.port, () => {
  logger.info(`Serveur démarré sur le port ${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal) {
  logger.info(`Signal ${signal} reçu, arrêt en cours...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
