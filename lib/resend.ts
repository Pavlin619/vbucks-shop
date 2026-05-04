import 'server-only';
import { Resend } from 'resend';
import { getRequiredEnv } from '@/lib/env';

export const resend = new Resend(getRequiredEnv('RESEND_API_KEY'));
