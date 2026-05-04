import 'server-only';
import Stripe from 'stripe';
import { getRequiredEnv } from '@/lib/env';

export const stripe = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'));
