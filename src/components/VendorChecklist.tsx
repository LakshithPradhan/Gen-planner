import React, { useState } from 'react';
import { VendorItem, VendorStatus, CurrencyCode } from '../types/plan';
import { formatCurrency } from '../lib/formatters';
import { CheckCircle2, Clock, PhoneCall, Plus, Trash2, Search, HelpCircle } from 'lucide-react';

interface VendorChecklistProps {
  vendors: VendorItem[];
  currency: CurrencyCode;
  onUpdateStatus: (id: string, status: VendorStatus) => void;
  onAddVendor: (vendor: { name: string; category: string; estimatedCost: number; whatToConfirm: string }) => void;
  onDeleteVendor: (id: string) => void;
}

export const VendorChecklist: React.FC<VendorChecklistProps> = ({
  vendors,
  currency,
  onUpdateStatus,
  onAddVendor,
  onDeleteVendor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VendorStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New vendor form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState(50000);
  const [tip, setTip] = useState('');

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.whatToConfirm.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const bookedCount = vendors.filter((v) => v.status === 'Booked').length;
  const contactedCount = vendors.filter((v) => v.status === 'Contacted').length;
  const toContactCount = vendors.filter((v) => v.status === 'To contact').length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;
    onAddVendor({
      name: name.trim(),
      category: category.trim(),
      estimatedCost: cost,
      whatToConfirm: tip.trim() || 'Verify payment milestone schedule and cancellation terms.',
    });
    setName('');
    setCategory('');
    setTip('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-sm border border-emerald-500/20 bg-emerald-950/10 p-3.5">
          <span className="text-[10px] uppercase font-mono-code text-emerald-400 block">
            Booked &amp; Contracted
          </span>
          <span className="text-xl font-bold text-emerald-300 font-mono-code">
            {bookedCount}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono-code block mt-0.5">
            Confirmed Partners
          </span>
        </div>

        <div className="rounded-sm border border-blue-500/20 bg-blue-950/10 p-3.5">
          <span className="text-[10px] uppercase font-mono-code text-[#3b82f6] block">
            In Active Talks
          </span>
          <span className="text-xl font-bold text-blue-200 font-mono-code">
            {contactedCount}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono-code block mt-0.5">
            Quote Negotiation
          </span>
        </div>

        <div className="rounded-sm border border-amber-500/20 bg-amber-950/10 p-3.5">
          <span className="text-[10px] uppercase font-mono-code text-amber-400 block">
            To Contact
          </span>
          <span className="text-xl font-bold text-amber-200 font-mono-code">
            {toContactCount}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono-code block mt-0.5">
            Uncontacted Leads
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search vendor or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xs border border-white/10 bg-white/5 pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-400 focus:border-[#0066ff] focus:outline-none font-mono-code"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-sm border border-white/10 text-xs font-mono-code">
            {(['all', 'To contact', 'Contacted', 'Booked'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 uppercase rounded-xs transition-colors cursor-pointer ${
                  statusFilter === st ? 'bg-[#0066ff] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="flex items-center gap-1.5 rounded-sm bg-white/10 px-3 py-1.5 text-xs font-mono-code uppercase text-white hover:bg-[#0066ff] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Add Vendor Form */}
      {showAddModal && (
        <form
          onSubmit={handleCreate}
          className="rounded-sm border border-[#0066ff]/40 bg-[#121218] p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono-code text-zinc-400 block mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Rajputana Mandap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white focus:border-[#0066ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono-code text-zinc-400 block mb-1">
                Category
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Floral & Mandap Decor"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white focus:border-[#0066ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono-code text-zinc-400 block mb-1">
                Estimated Cost ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xs border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white font-mono-code focus:border-[#0066ff] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono-code text-zinc-400 block mb-1">
              What To Confirm Tip
            </label>
            <input
              type="text"
              placeholder="e.g. Confirm generator backup, overtime fee after midnight, and setup crew count."
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              className="w-full rounded-xs border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white focus:border-[#0066ff] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-xs border border-white/10 px-3 py-1.5 text-xs font-mono-code uppercase text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xs bg-[#0066ff] px-4 py-1.5 text-xs font-mono-code uppercase text-white hover:bg-[#0055d4]"
            >
              Save Vendor
            </button>
          </div>
        </form>
      )}

      {/* Vendors Table / Cards */}
      <div className="space-y-3">
        {filteredVendors.map((vendor) => {
          return (
            <div
              key={vendor.id}
              className="group rounded-sm border border-white/10 bg-[#101014] p-4 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {vendor.name}
                    </span>
                    <span className="rounded-xs bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono-code text-zinc-400">
                      {vendor.category}
                    </span>
                    <span className="text-xs font-mono-code text-[#0066ff]">
                      Est. {formatCurrency(vendor.estimatedCost, currency)}
                    </span>
                  </div>

                  {/* "What to confirm" negotiation tip */}
                  <div className="mt-2 flex items-start gap-1.5 rounded-xs border border-white/5 bg-black/40 p-2 text-xs text-zinc-300">
                    <HelpCircle className="h-3.5 w-3.5 shrink-0 text-[#0066ff] mt-0.5" />
                    <div>
                      <span className="text-[10px] font-mono-code uppercase text-zinc-400 mr-1.5">
                        WHAT TO CONFIRM:
                      </span>
                      <span>{vendor.whatToConfirm}</span>
                    </div>
                  </div>
                </div>

                {/* Status Switcher & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex rounded-xs border border-white/10 bg-black/50 p-0.5 font-mono-code text-[11px]">
                    {(['To contact', 'Contacted', 'Booked'] as const).map((st) => {
                      const isActive = vendor.status === st;
                      let activeClass = 'bg-[#0066ff] text-white';
                      if (st === 'Booked') activeClass = 'bg-emerald-600 text-white';
                      if (st === 'To contact') activeClass = 'bg-amber-600 text-white';

                      return (
                        <button
                          key={st}
                          onClick={() => onUpdateStatus(vendor.id, st)}
                          className={`px-2.5 py-1 rounded-xs uppercase transition-all cursor-pointer ${
                            isActive ? activeClass : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {st === 'Booked' && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                          {st === 'Contacted' && <PhoneCall className="inline h-3 w-3 mr-1" />}
                          {st === 'To contact' && <Clock className="inline h-3 w-3 mr-1" />}
                          {st}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => onDeleteVendor(vendor.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xs transition-colors cursor-pointer"
                    title="Remove vendor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
