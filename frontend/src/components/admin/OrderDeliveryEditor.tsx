import React, { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Printer, Trash2, Truck, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ordersService } from '../../api/orders';
import { Order } from '../../types';
import { formatDbDate, estimateLabel, euro } from '../../utils/delivery';
import { printAddressSlip } from '../../utils/printSlip';

// Delivery is by DPD, handled MANUALLY: the admin types the tracking number
// and URL and moves the order through Processing / Dispatched / Delivered.
// Nothing is fetched from DPD and no tracking number is generated.
const COURIER = 'DPD';

const inputClass =
  'w-full px-2.5 py-1.5 text-[11px] text-white bg-black border border-white/10 focus:border-emerald-500 outline-none rounded-lg';

export const OrderDeliveryEditor: React.FC<{
  order: Order;
  onChange: (patch: Partial<Order>) => void;
}> = ({ order, onChange }) => {
  const [number, setNumber] = useState(order.trackingNumber || '');
  const [url, setUrl] = useState(order.trackingUrl || '');
  const [busy, setBusy] = useState(false);
  const [labelBusy, setLabelBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNumber(order.trackingNumber || '');
    setUrl(order.trackingUrl || '');
  }, [order.trackingNumber, order.trackingUrl]);

  const send = async (payload: Parameters<typeof ordersService.updateDelivery>[1], okMsg: string) => {
    setBusy(true);
    try {
      const patch = await ordersService.updateDelivery(order.id, payload);
      onChange(patch);
      toast.success(okMsg);
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const details = { courierName: COURIER, trackingNumber: number.trim(), trackingUrl: url.trim() };
  const status = (order.status || '').toLowerCase();
  const estimate = estimateLabel(order.deliveryEstimateText, order.deliveryEstMinDays, order.deliveryEstMaxDays);

  const dispatch = () => {
    if (!number.trim() && !window.confirm(
      'No tracking number entered. The customer will be emailed that the order is dispatched WITHOUT tracking details (you can add them later and they will be emailed again). Continue?'
    )) return;
    send({ status: 'shipped', ...details }, 'Order marked Dispatched');
  };

  const stepBtn = (label: string, value: string, onClick: () => void) => (
    <button
      type="button"
      disabled={busy || status === value}
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg border cursor-pointer disabled:cursor-default ${
        status === value
          ? 'bg-emerald-500 text-black border-emerald-500'
          : 'text-white/70 border-white/15 hover:text-white hover:border-white/30 disabled:opacity-40'
      }`}
    >
      {label}
    </button>
  );

  // ---- DPD label (uploaded manually) ----
  const onPickLabel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Label file is too large (max 5 MB).');
      return;
    }
    setLabelBusy(true);
    try {
      const res = await ordersService.uploadLabel(order.id, file);
      onChange({ labelUploadedAt: res.label_uploaded_at || new Date().toISOString() });
      toast.success('Label uploaded.');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setLabelBusy(false);
    }
  };

  const openLabel = async () => {
    // Open the tab first (inside the click) so pop-up blockers allow it.
    const win = window.open('', '_blank');
    setLabelBusy(true);
    try {
      const blobUrl = await ordersService.fetchLabelUrl(order.id);
      if (win) win.location.href = blobUrl;
      else window.location.href = blobUrl;
    } catch (err: any) {
      win?.close();
      toast.error(err.message || 'Could not open the label.');
    } finally {
      setLabelBusy(false);
    }
  };

  const removeLabel = async () => {
    if (!window.confirm('Remove the uploaded label from this order?')) return;
    setLabelBusy(true);
    try {
      await ordersService.deleteLabel(order.id);
      onChange({ labelUploadedAt: null });
      toast.success('Label removed.');
    } catch (err: any) {
      toast.error(err.message || 'Could not remove the label.');
    } finally {
      setLabelBusy(false);
    }
  };

  const slip = () => {
    try { printAddressSlip(order); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-white/5">
      <p className="text-[9px] uppercase text-white/40 font-bold tracking-wider flex items-center gap-1.5">
        <Truck size={11} /> Delivery · DPD
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-white/60">
        <span>Method: <span className="text-white">{order.deliveryMethodName || 'Not recorded (older order)'}</span>{estimate && <span className="text-white/40"> · {estimate}</span>}</span>
        <span>Fee: <span className="text-white">{order.deliveryMethodName ? (Number(order.deliveryCost) > 0 ? euro(order.deliveryCost) : 'FREE') : '—'}</span></span>
        <span className="sm:col-span-2">Eircode: <span className="text-white">{order.postalCode || '—'}</span>{order.county && <span className="text-white/40"> · Co. {order.county}</span>}</span>
        {order.phone && <span>Phone: <span className="text-white">{order.phone}</span></span>}
        {order.dispatchedAt && <span>Dispatched: <span className="text-white">{formatDbDate(order.dispatchedAt)}</span></span>}
        {order.deliveredAt && <span>Delivered: <span className="text-white">{formatDbDate(order.deliveredAt)}</span></span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input className={`${inputClass} text-white/60`} value="Courier: DPD" readOnly aria-label="Courier" />
        <input className={inputClass} placeholder="Tracking number (from DPD)" maxLength={100} value={number} onChange={e => setNumber(e.target.value)} />
        <input className={inputClass} placeholder="Tracking URL (https://…)" maxLength={500} value={url} onChange={e => setUrl(e.target.value)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => send(details, 'Tracking details saved')}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-white/10 hover:bg-white/15 text-white cursor-pointer disabled:opacity-40"
        >
          {busy ? <Loader2 size={11} className="animate-spin inline" /> : 'Save tracking details'}
        </button>
        <span className="text-white/20">|</span>
        {stepBtn('Processing', 'processing', () => send({ status: 'processing' }, 'Order marked Processing'))}
        {stepBtn('Dispatched', 'shipped', dispatch)}
        {stepBtn('Delivered', 'delivered', () => send({ status: 'delivered' }, 'Order marked Delivered'))}
      </div>
      <p className="text-[9px] text-white/30">
        Tracking and status are entered by hand — nothing is fetched from DPD automatically. The customer is emailed once per change, and always sees the latest status you set.
      </p>

      {/* Shipping label (manual upload / print workflow) */}
      <div className="p-3 bg-black/30 border border-white/8 rounded-lg space-y-2">
        <p className="text-[9px] uppercase text-white/40 font-bold tracking-wider flex items-center gap-1.5">
          <FileText size={11} /> Shipping label
        </p>
        <p className="text-[10px] text-white/40">
          Create the label in your DPD account, then upload it here (PDF, PNG or JPG, max 5 MB) to keep it with the order and print it.
          Labels are private — only admins can open them.
        </p>
        <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={onPickLabel} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={labelBusy} onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer disabled:opacity-40">
            {labelBusy ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            {order.labelUploadedAt ? 'Replace label' : 'Upload label'}
          </button>
          {order.labelUploadedAt && (
            <>
              <button type="button" disabled={labelBusy} onClick={openLabel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-white/10 hover:bg-white/15 text-white cursor-pointer disabled:opacity-40">
                <Printer size={11} /> View / print label
              </button>
              <button type="button" disabled={labelBusy} onClick={removeLabel}
                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer" title="Remove label">
                <Trash2 size={13} />
              </button>
              <span className="text-[10px] text-white/30">Uploaded {formatDbDate(order.labelUploadedAt)}</span>
            </>
          )}
          <button type="button" onClick={slip}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg border border-white/15 text-white/60 hover:text-white cursor-pointer">
            Print address slip
          </button>
        </div>
      </div>
    </div>
  );
};