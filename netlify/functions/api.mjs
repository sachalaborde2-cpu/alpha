// Fonction Netlify : /api/* → logique dans netlify/lib/alpha-api.mjs, données dans Netlify Blobs.
import { getStore } from '@netlify/blobs';
import { handle } from '../lib/alpha-api.mjs';

export default async req => handle(req, getStore({ name: 'alpha', consistency: 'strong' }));

export const config = { path: '/api/*' };
