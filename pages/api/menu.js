// pages/api/menu.js

import { supabaseAdmin } from '../../lib/supabase'; // ✅ Σωστό import για API routes

export default async function handler(req, res) {
  const { restaurant } = req.query;

  if (!restaurant) {
    return res.status(400).json({ error: 'Missing restaurant id' });
  }

  // Βρίσκουμε το εστιατόριο με βάση το slug (π.χ. estiatorio123)
  const { data: restaurantData, error: restError } = await supabaseAdmin
    .from('restaurants')
    .select('id, theme')
    .eq('slug', restaurant)
    .single();

  if (restError || !restaurantData) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  const { id: restaurant_id, theme } = restaurantData;

  // Φέρνουμε το μενού του μαγαζιού
  const { data: menu, error: menuError } = await supabaseAdmin
    .from('menu_items')
    .select('id, title, description, price, image_url, category')
    .eq('restaurant_id', restaurant_id)
    .eq('available', true);

  if (menuError) {
    return res.status(500).json({ error: 'Failed to load menu' });
  }

  res.status(200).json({ menu, theme });
}
