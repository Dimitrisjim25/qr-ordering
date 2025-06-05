// pages/api/order.js

import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { restaurant_id, table_id, items } = req.body;

  if (!restaurant_id || !table_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  // Δημιουργία παραγγελίας
  const { data: orderData, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      restaurant_id,
      table_id,
      status: 'pending'
    })
    .select('id')
    .single();

  if (orderError) {
    return res.status(500).json({ error: 'Order creation failed', details: orderError });
  }

  const order_id = orderData.id;

  // Δημιουργία προϊόντων παραγγελίας
  const itemsToInsert = items.map(({ menu_item_id, quantity }) => ({
    order_id,
    menu_item_id,
    quantity
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(itemsToInsert);

  if (itemsError) {
    return res.status(500).json({ error: 'Order items failed', details: itemsError });
  }

  return res.status(200).json({ message: 'Order created', order_id });
}
