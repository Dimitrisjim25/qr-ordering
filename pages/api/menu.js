import cors, { runMiddleware } from '../../lib/cors';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  // Ενεργοποίηση CORS για κάθε αίτημα (GET, POST, OPTIONS)
  await runMiddleware(req, res, cors);

  // Διαβάζουμε το ερώτημα (π.χ. ?restaurant=vasilikos)
  const { restaurant } = req.query;

  // Βασικό validation για το slug του εστιατορίου (μόνο αλφαριθμητικά, -, _)
  if (!restaurant || !restaurant.match(/^[a-z0-9_-]+$/i)) {
    return res.status(400).json({ error: 'Invalid or missing restaurant identifier' });
  }

  // Βρίσκουμε το εστιατόριο (μόνο αν έχει public menu)
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

  // Φέρνουμε τα διαθέσιμα προϊόντα
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

  // ΕΔΩ το "μαγικό": Καθαρίζουμε το image_url από διπλά slash
  const cleanedMenu = menu.map(item => ({
    ...item,
    image_url: item.image_url
      ? item.image_url.replace(/\/{2,}/g, '/').replace('https:/', 'https://')
      : null,
  }));

  // Success: Επιστρέφουμε τα προϊόντα και το theme (αν έχει)
  res.status(200).json({ menu: cleanedMenu, theme });
}
