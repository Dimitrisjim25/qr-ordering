import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { restaurant_id, table_id, items } = req.body;

  if (
    !restaurant_id ||
    !table_id ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  // Επιβεβαίωση ότι το τραπέζι είναι ενεργό και ανήκει στο restaurant
  const { data: table, error: tableError } = await supabaseAdmin
    .from('tables')
    .select('id')
    .eq('id', table_id)
    .eq('restaurant_id', restaurant_id)
    .eq('active', true)
    .single();

  if (tableError || !table) {
    return res.status(400).json({ error: 'Invalid or inactive table' });
  }

  // Επιβεβαίωση ότι όλα τα menu items ανήκουν στο ίδιο restaurant
  const menuItemIds = items.map(i => i.menu_item_id);
  const { data: validItems, error: itemsCheckError } = await supabaseAdmin
    .from('menu_items')
    .select('id')
    .in('id', menuItemIds)
    .eq('restaurant_id', restaurant_id);

  if (itemsCheckError || validItems.length !== items.length) {
    return res.status(400).json({ error: 'Invalid menu items for this restaurant' });
  }

  // Validation quantity
  for (const { quantity } of items) {
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity value' });
    }
  }

  // Δημιουργία παραγγελίας
  const { data: orderData, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      restaurant_id,
      table_id,
      status: 'pending',
    })
    .select('id')
    .single();

  if (orderError) {
    return res.status(500).json({ error: 'Order creation failed', details: orderError });
  }

  const order_id = orderData.id;

  const itemsToInsert = items.map(({ menu_item_id, quantity }) => ({
    order_id,
    menu_item_id,
    quantity,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(itemsToInsert);

  if (itemsError) {
    // Καθαρίζουμε orphaned παραγγελία
    await supabaseAdmin.from('orders').delete().eq('id', order_id);
    return res.status(500).json({ error: 'Order items failed', details: itemsError });
  }

  return res.status(200).json({ message: 'Order created', order_id });
}
