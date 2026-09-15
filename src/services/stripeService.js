const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const env = require('../config/env');
const offerService = require('./offerService');
const notificationService = require('./notificationService');
const logService = require('./logService');

// Devises Stripe "zero-decimal" (le montant n'est PAS multiplié par 100)
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

function isConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function getClient() {
  if (!isConfigured()) return null;
  const Stripe = require('stripe');
  return Stripe(process.env.STRIPE_SECRET_KEY);
}

/** Normalise une devise en code ISO 3 lettres (garde-fou si un admin tape "EURO" au lieu de "EUR") */
function normalizeCurrency(raw) {
  const code = (raw || 'EUR').trim().toUpperCase().slice(0, 3);
  return code || 'EUR';
}

function toStripeAmount(price, currencyCode) {
  const amount = Number(price) || 0;
  return ZERO_DECIMAL_CURRENCIES.has(currencyCode) ? Math.round(amount) : Math.round(amount * 100);
}

/**
 * Calcule le récapitulatif de paiement d'un projet (prix total, acompte 50%, solde 50%,
 * statuts réels s'ils existent déjà en base). Ne nécessite pas Stripe configuré pour être lu
 * (permet d'afficher les montants même avant activation).
 */
async function getPaymentSummary(project) {
  const offers = await offerService.getOffers();
  const offer = offers.find((o) => o.id === project.offerType);
  const currency = normalizeCurrency(offer ? offer.currency : 'EUR');
  const totalPrice = offer ? offer.price : 0;
  const depositAmount = Math.round(totalPrice / 2);
  const balanceAmount = totalPrice - depositAmount;

  const payments = await prisma.payment.findMany({ where: { projectId: project.id }, orderBy: { createdAt: 'desc' } });
  const deposit = payments.find((p) => p.type === 'DEPOSIT');
  const balance = payments.find((p) => p.type === 'BALANCE');

  return {
    offerName: offer ? offer.name : null,
    currency,
    totalPrice,
    deposit: { amount: depositAmount, status: deposit ? deposit.status : 'PENDING', paidAt: deposit ? deposit.paidAt : null },
    balance: { amount: balanceAmount, status: balance ? balance.status : 'PENDING', paidAt: balance ? balance.paidAt : null },
    stripeConfigured: isConfigured(),
  };
}

/**
 * Crée une session Stripe Checkout pour l'acompte ou le solde. Seul le client propriétaire
 * peut déclencher un paiement. Ne fait jamais confiance au front pour valider un paiement —
 * seul le webhook Stripe (vérifié par signature) marque un paiement comme réussi.
 */
async function createCheckoutSession(user, project, type) {
  if (!['DEPOSIT', 'BALANCE'].includes(type)) {
    throw ApiError.badRequest('Type de paiement invalide.');
  }
  if (user.role !== 'CLIENT' || project.clientId !== user.id) {
    throw ApiError.forbidden('Seul le client propriétaire peut initier un paiement.');
  }
  if (!isConfigured()) {
    throw ApiError.badRequest("Le paiement en ligne n'est pas encore activé. Contactez votre agence.");
  }
  if (!project.offerType) {
    throw ApiError.badRequest('Aucune offre associée à ce projet.');
  }

  const summary = await getPaymentSummary(project);
  const target = type === 'DEPOSIT' ? summary.deposit : summary.balance;
  if (target.status === 'SUCCEEDED') {
    throw ApiError.conflict('Ce paiement a déjà été effectué.');
  }
  if (type === 'BALANCE' && summary.deposit.status !== 'SUCCEEDED') {
    throw ApiError.badRequest("L'acompte doit être payé avant de pouvoir régler le solde.");
  }

  const stripe = getClient();
  const unitAmount = toStripeAmount(target.amount, summary.currency);
  const label = type === 'DEPOSIT' ? 'Acompte (50%)' : 'Solde (50%)';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: project.client ? project.client.email : undefined,
    line_items: [{
      price_data: {
        currency: summary.currency.toLowerCase(),
        product_data: { name: `${project.name} — ${label}` },
        unit_amount: unitAmount,
      },
      quantity: 1,
    }],
    metadata: { projectId: String(project.id), type },
    success_url: `${env.frontendUrl}/#project/${project.id}`,
    cancel_url: `${env.frontendUrl}/#project/${project.id}`,
  });

  await prisma.payment.create({
    data: {
      projectId: project.id,
      stripePaymentId: session.id,
      amount: unitAmount,
      currency: summary.currency,
      type,
      status: 'PENDING',
    },
  });

  return session.url;
}

/**
 * Traite un événement webhook Stripe (signature vérifiée). Idempotent : un même event Stripe
 * ne sera jamais traité deux fois (protège contre les renvois automatiques de Stripe).
 */
async function handleWebhookEvent(rawBody, signature) {
  if (!isConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw ApiError.badRequest('Webhook Stripe non configuré.');
  }
  const stripe = getClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw ApiError.badRequest('Signature webhook invalide.');
  }

  const alreadyProcessed = await prisma.payment.findFirst({ where: { stripeEventId: event.id } });
  if (alreadyProcessed) return;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const payment = await prisma.payment.findFirst({ where: { stripePaymentId: session.id } });
    if (payment && payment.status !== 'SUCCEEDED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          paidAt: new Date(),
          stripeCustomerId: session.customer || null,
          stripeEventId: event.id,
        },
      });

      const project = await prisma.project.findUnique({ where: { id: payment.projectId } });
      if (project) {
        logService.log('payment_succeeded', `Paiement ${payment.type === 'DEPOSIT' ? 'acompte' : 'solde'} reçu pour "${project.name}" (${payment.amount} ${payment.currency})`);

        if (payment.type === 'DEPOSIT' && ['BRIEF_VALIDATED', 'NEW', 'BRIEF_PENDING'].includes(project.status)) {
          await prisma.project.update({ where: { id: project.id }, data: { status: 'IN_PRODUCTION' } });
        }
        if (payment.type === 'BALANCE' && project.status === 'READY_FOR_DELIVERY') {
          await prisma.project.update({ where: { id: project.id }, data: { status: 'DELIVERED' } });
        }

        if (project.assignedUserId) {
          await notificationService.createNotification(
            project.assignedUserId,
            project.id,
            'payment_received',
            'Paiement reçu',
            `Le ${payment.type === 'DEPOSIT' ? "acompte" : 'solde'} a été payé pour "${project.name}".`
          );
        }
      }
    }
  }
}

module.exports = { isConfigured, getPaymentSummary, createCheckoutSession, handleWebhookEvent, normalizeCurrency, toStripeAmount };
