import { Order } from '../types';

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Opens a print-ready delivery address slip for an order. This is a plain
// packing / address slip made from the order data — it is NOT a DPD shipping
// label (those come from the DPD portal and are uploaded to the order).
export function printAddressSlip(order: Order): void {
  const win = window.open('', '_blank', 'width=520,height=640');
  if (!win) {
    throw new Error('Your browser blocked the print window. Allow pop-ups for this site and try again.');
  }

  const lines = [order.customerName, order.address, order.address2, order.city, order.county, order.postalCode, order.country]
    .filter(Boolean)
    .map((l) => `<div>${esc(l)}</div>`)
    .join('');

  const items = (order.items || [])
    .map((i) => `<li>${esc(i.name)}${i.flavour ? ` (${esc(i.flavour)})` : ''} × ${esc(i.quantity)}</li>`)
    .join('');

  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Order #${esc(order.id)} address slip</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#000}
  h1{font-size:14px;margin:0 0 4px}
  .note{font-size:10px;color:#555;margin-bottom:16px}
  .addr{font-size:20px;line-height:1.35;border:2px solid #000;padding:14px;margin-bottom:14px}
  .meta{font-size:12px;line-height:1.6}
  ul{margin:6px 0 0 18px;padding:0;font-size:12px}
  @media print{button{display:none}}
</style></head><body>
<h1>CeltiCore — Order #${esc(order.id)}</h1>
<div class="note">Delivery address slip (not a DPD shipping label)</div>
<div class="addr">${lines}</div>
<div class="meta">
  ${order.phone ? `<div>Phone: ${esc(order.phone)}</div>` : ''}
  ${order.deliveryMethodName ? `<div>Delivery: ${esc(order.deliveryMethodName)}</div>` : ''}
  ${order.trackingNumber ? `<div>Tracking: ${esc(order.trackingNumber)}</div>` : ''}
  <div>Items:</div><ul>${items}</ul>
</div>
<button onclick="window.print()" style="margin-top:18px;padding:8px 16px">Print</button>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
}