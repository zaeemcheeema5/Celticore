import React, { useEffect, useState } from 'react';
import { Loader2, Save, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { deliveryService, AdminDeliveryConfig } from '../../api/delivery';

// Admin > Delivery Settings. Everything here is stored in the database and
// used by the server for every checkout — no code changes needed.
// Customers do NOT choose a delivery method: the method selected under
// "Applied to every order" is used for all of them.
const inputClass =
  'w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none rounded-lg text-xs';

export const DeliverySettingsPanel: React.FC = () => {
  const [config, setConfig] = useState<AdminDeliveryConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      setConfig(await deliveryService.getAdminConfig());
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery settings.');
    }
  };

  useEffect(() => { load(); }, []);

  const updateMethod = (code: string, patch: Record<string, any>) =>
    setConfig(c => c && ({ ...c, methods: c.methods.map(m => (m.code === code ? { ...m, ...patch } : m)) }));

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const saved = await deliveryService.saveAdminConfig(config);
      setConfig(c => c && ({
        ...c,
        methods: saved.methods,
        freeDelivery: saved.freeDelivery,
        checkoutMethod: saved.checkoutMethod,
        deliveryNotice: saved.deliveryNotice,
      }));
      toast.success('Delivery settings saved.');
    } catch (err: any) {
      toast.error(err.message || 'Could not save delivery settings.');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="py-14 text-center space-y-3">
        <p className="text-xs text-red-400">{error}</p>
        <button onClick={load} className="px-4 py-2 border border-white/15 text-[10px] uppercase font-bold text-white cursor-pointer rounded">Retry</button>
      </div>
    );
  }
  if (!config) {
    return <div className="flex items-center justify-center gap-2 py-14 text-white/40 text-xs"><Loader2 size={14} className="animate-spin" /> Loading…</div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <p className="text-[11px] text-white/40">
        All prices are in EUR (€), fixed nationwide (not based on weight or size). Delivery is Republic of Ireland only, by DPD.
        Customers do not pick a delivery method — the one chosen below is applied to every order.
      </p>

      <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/8 rounded-xl space-y-3 text-xs">
        <span className="font-black text-white text-sm uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Applied to every order</span>
        <select
          className={`${inputClass} cursor-pointer max-w-xs`}
          value="express"
          disabled
          onChange={() => { /* Next-Day is the only delivery method (fixed) */ }}
        >
          <option value="express">Next-Day Delivery (only method)</option>
        </select>
        <div>
          <label className="block text-[9px] uppercase text-white/40 mb-1">Notice shown at checkout and in emails</label>
          <textarea
            className={`${inputClass} min-h-[56px]`} maxLength={300}
            value={config.deliveryNotice}
            onChange={e => setConfig(c => c && ({ ...c, deliveryNotice: e.target.value }))}
          />
        </div>
      </div>

      {config.methods.map((m) => {
        const unconfirmed = false;
        return (
          <div key={m.code} className="p-4 sm:p-5 bg-white/[0.03] border border-white/8 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-black text-white text-sm uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <Truck size={14} className="text-emerald-400" /> {m.name}
              </span>
              <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                <input type="checkbox" checked={m.code === 'express'} disabled readOnly />
                {m.code === 'express' ? 'Always enabled' : 'Disabled (not used)'}
              </label>
            </div>
            {unconfirmed && (
              <p className="text-[10px] text-amber-400">
                Price and delivery estimate not confirmed by the client yet — set them here before enabling this method.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] uppercase text-white/40 mb-1">Display name</label>
                <input className={inputClass} maxLength={100} value={m.name} onChange={e => updateMethod(m.code, { name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-white/40 mb-1">Delivery fee (€, fixed)</label>
                <input type="number" min={0} step="0.01" className={inputClass} value={m.fee}
                  onChange={e => updateMethod(m.code, { fee: e.target.value === '' ? 0 : Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] uppercase text-white/40 mb-1">Estimate wording shown to customers (an estimate, never a guarantee)</label>
                <input className={inputClass} maxLength={255} placeholder="e.g. Next working day (99% of parcels)"
                  value={m.estimateText} onChange={e => updateMethod(m.code, { estimateText: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] uppercase text-white/40 mb-1">Short description</label>
                <input className={inputClass} maxLength={255} value={m.description} onChange={e => updateMethod(m.code, { description: e.target.value })} />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-white/40 mb-1">Min working days (fallback if no wording)</label>
                <input type="number" min={0} step="1" className={inputClass} value={m.estMinDays}
                  onChange={e => updateMethod(m.code, { estMinDays: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-white/40 mb-1">Max working days (fallback if no wording)</label>
                <input type="number" min={0} step="1" className={inputClass} value={m.estMaxDays}
                  onChange={e => updateMethod(m.code, { estMaxDays: Number(e.target.value) })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-white/60 cursor-pointer">
              <input type="checkbox" checked={m.freeEligible} onChange={e => updateMethod(m.code, { freeEligible: e.target.checked })} />
              Free when the order reaches the free-delivery minimum
            </label>
          </div>
        );
      })}

      <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/8 rounded-xl space-y-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="font-black text-white text-sm uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Free delivery</span>
          <label className="flex items-center gap-2 text-white/60 cursor-pointer">
            <input type="checkbox" checked={config.freeDelivery.enabled}
              onChange={e => setConfig(c => c && ({ ...c, freeDelivery: { ...c.freeDelivery, enabled: e.target.checked } }))} />
            Enabled
          </label>
        </div>
        <div className="max-w-xs">
          <label className="block text-[9px] uppercase text-white/40 mb-1">Free delivery for orders of (€) or more, after discount</label>
          <input type="number" min={0} step="0.01" className={inputClass} value={config.freeDelivery.threshold}
            onChange={e => setConfig(c => c && ({ ...c, freeDelivery: { ...c.freeDelivery, threshold: e.target.value === '' ? 0 : Number(e.target.value) } }))} />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-widest rounded-lg cursor-pointer"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save delivery settings
      </button>
    </div>
  );
};