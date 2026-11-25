'use client';

import React, { useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Part } from '@/types';

interface PartsClientProps {
  initialParts: Part[];
  orgId: string;
}

export function PartsClient({ initialParts, orgId }: PartsClientProps) {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New Part Form State
  const [newPartNo, setNewPartNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newUom, setNewUom] = useState('piece');
  const [newPrice, setNewPrice] = useState('');

  const filteredParts = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.part_no && p.part_no.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPart: Part = {
      part_id: `part-${Date.now()}`,
      org_id: orgId,
      part_no: newPartNo.trim() || `PRT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName.trim(),
      uom: newUom.trim() || 'piece',
      sell_price: parseFloat(newPrice) || 0,
    };

    setParts([newPart, ...parts]);
    setNewPartNo('');
    setNewName('');
    setNewUom('piece');
    setNewPrice('');
    setIsAdding(false);
  };

  const handleDelete = (partId: string) => {
    setParts(parts.filter((p) => p.part_id !== partId));
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 w-80 text-xs shadow-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts by name or part number..."
            className="bg-transparent border-none outline-none text-slate-900 dark:text-white w-full placeholder:text-slate-400 text-xs"
          />
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-semibold flex items-center gap-2"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Cancel' : 'Add New Part'}
        </Button>
      </div>

      {/* Add New Part Modal / Form */}
      {isAdding && (
        <form
          onSubmit={handleAddPart}
          className="p-5 rounded-xl border border-blue-200 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-900/90 shadow-sm space-y-4"
        >
          <div className="text-xs font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider">
            Register New Spare Part
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Part Number</label>
              <input
                type="text"
                value={newPartNo}
                onChange={(e) => setNewPartNo(e.target.value)}
                placeholder="e.g. COMP-1.5T"
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Part Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Rotary Compressor 1.5 Ton"
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unit of Measure (UOM)</label>
              <input
                type="text"
                value={newUom}
                onChange={(e) => setNewUom(e.target.value)}
                placeholder="e.g. piece, kg, metre"
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sell Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Part to Catalogue
            </Button>
          </div>
        </form>
      )}

      {/* Parts Table */}
      <Card className="shadow-xs border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Part Number</th>
                  <th className="py-3 px-4">Description / Name</th>
                  <th className="py-3 px-4">UOM</th>
                  <th className="py-3 px-4 text-right">Standard Sell Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching parts found.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((p) => (
                    <tr key={p.part_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {p.part_no || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{p.uom}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        ₹{Number(p.sell_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(p.part_id)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors"
                          title="Delete part"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
