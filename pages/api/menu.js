import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  const { restaurant } = req.query;

  // Validation για slug (μόνο αλφαριθμητικά, παύλα, underscore)
  if (!restaurant || !restaurant.match(/^[a-z0-9_-]+$/i)) {
    return res.status(400).json({ error: 'Invalid or missing restaurant identifier' });
  }

  // Φέρνουμε το εστιατόριο, μόνο αν έχει public menu
  const { data: restaurantData, error: restError } = await supabaseAdmin
    .from('restaurants')
    .select('id, theme')
    .eq('slug', restaurant)
    .eq('public_menu', true)
    .single();

  if (restError || !restaurantData) {
    return res.status(404).json({ error: 'Restaurant not found or menu not public' });
  }

  const { id: restaurant_id, theme } = restaurantData;

  // Φέρνουμε το διαθέσιμο μενού
  const { data: menu, error: menuError } = await supabaseAdmin
    .from('menu_items')
    .select('id, title, description, price, image_url, category')
    .eq('restaurant_id', restaurant_id)
    .eq('available', true)
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (menuError) {
    return res.status(500).json({ error: 'Failed to load menu' });
  }

  if (!menu || menu.length === 0) {
    return res.status(200).json({ menu: [], theme, message: 'Δεν υπάρχουν διαθέσιμα προϊόντα' });
  }

  res.status(200).json({ menu, theme });
}
