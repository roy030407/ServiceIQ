'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  X,
  Shield,
  Building,
  CheckCircle2,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface EquipmentItem {
  unit_id: string;
  serial_no: string;
  model_name: string;
  category: string;
  brand: string;
  site_name: string;
  customer_name: string;
  installed_on: string;
  warranty_end: string;
  amc_status: 'active' | 'expiring' | 'none';
  amc_contract_no?: string;
  last_service_date: string;
  operational_status: 'operational' | 'needs_service' | 'under_repair';
}

interface EquipmentClientProps {
  initialEquipment: EquipmentItem[];
  orgId?: string;
}

export function EquipmentClient({ initialEquipment }: EquipmentClientProps) {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(initialEquipment);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'amc' | 'warranty' | 'service_needed'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newCategory, setNewCategory] = useState('HVAC');
  const [newSite, setNewSite] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newWarrantyDate, setNewWarrantyDate] = useState('');

  const now = new Date();

  // Filtered Items
  const filteredItems = equipmentList.filter((item) => {
    const matchesSearch =
      item.model_name.toLowerCase().includes(search.toLowerCase()) ||
      item.serial_no.toLowerCase().includes(search.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      item.site_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'amc') return item.amc_status === 'active';
    if (filterTab === 'warranty') {
      const wDate = new Date(item.warranty_end);
      return wDate > now;
    }
    if (filterTab === 'service_needed') return item.operational_status !== 'operational';

    return true;
  });

  const totalUnits = equipmentList.length;
  const amcUnits = equipmentList.filter((e) => e.amc_status === 'active').length;
  const warrantyUnits = equipmentList.filter((e) => new Date(e.warranty_end) > now).length;
  const serviceNeededUnits = equipmentList.filter((e) => e.operational_status !== 'operational').length;

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) return;

    const newItem: EquipmentItem = {
      unit_id: `unit-${Date.now()}`,
      model_name: newModel.trim(),
      serial_no: newSerial.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      category: newCategory,
      brand: 'Standard OEM',
      site_name: newSite.trim() || 'Main Site Facility',
      customer_name: newCustomer.trim() || 'Client Enterprise',
      installed_on: new Date().toISOString().split('T')[0],
      warranty_end: newWarrantyDate || new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0],
      amc_status: 'active',
      amc_contract_no: 'AMC-2026-NEW',
      last_service_date: new Date().toISOString().split('T')[0],
      operational_status: 'operational',
    };

    setEquipmentList([newItem, ...equipmentList]);
    setNewModel('');
    setNewSerial('');
    setNewSite('');
    setNewCustomer('');
    setNewWarrantyDate('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Installed Base</span>
              <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalUnits}</div>
            <span className="text-[11px] text-slate-400">Assets across all client sites</span>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Under Active AMC</span>
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{amcUnits}</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Covered by contracts</span>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Under Warranty</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{warrantyUnits}</div>
            <span className="text-[11px] text-slate-400">OEM warranty active</span>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Service Required</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{serviceNeededUnits}</div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Attention recommended</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 w-72 text-xs shadow-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by serial, model, or customer..."
              className="bg-transparent border-none outline-none text-slate-900 dark:text-white w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({totalUnits})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('amc')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterTab === 'amc'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              AMC Covered ({amcUnits})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('warranty')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterTab === 'warranty'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Under Warranty ({warrantyUnits})
            </button>
          </div>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-semibold flex items-center gap-2"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Cancel' : 'Register New Equipment'}
        </Button>
      </div>

      {/* Add New Equipment Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleAddEquipment}
          className="p-5 rounded-xl border border-blue-200 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-900/90 shadow-xs space-y-4"
        >
          <div className="text-xs font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-4 h-4" /> Register New Installed Asset
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Product Model / Name *
              </label>
              <input
                type="text"
                required
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="e.g. Daikin Inverter Split AC 1.5T"
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Serial Number / QR Tag
              </label>
              <input
                type="text"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                placeholder="e.g. SN-DKN-90214"
                className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="HVAC">HVAC / Air Conditioning</option>
                <option value="Elevators">Passenger Elevator</option>
                <option value="Generators">Diesel Generator Backup</option>
                <option value="Fire Safety">Fire Protection System</option>
                <option value="Chillers">Water Cooled Chiller</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                placeholder="e.g. Commercial Facility A"
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Installed Site / Location
              </label>
              <input
                type="text"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                placeholder="e.g. Tower 2, Server Room B"
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Warranty Expiration Date
              </label>
              <input
                type="date"
                value={newWarrantyDate}
                onChange={(e) => setNewWarrantyDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
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
              Save Equipment to Installed Base
            </Button>
          </div>
        </form>
      )}

      {/* Equipment Table */}
      <Card className="shadow-xs border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Installed Asset Inventory</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Verified serialized equipment, warranty coverage, and active maintenance contracts
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs dark:border-slate-800 dark:text-slate-300 font-mono">
            {filteredItems.length} matching units
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Equipment Model & Category</th>
                  <th className="py-3 px-4">Serial / QR Tag</th>
                  <th className="py-3 px-4">Customer & Site Location</th>
                  <th className="py-3 px-4 text-center">AMC Contract</th>
                  <th className="py-3 px-4 text-center">Warranty End</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching equipment found in inventory.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.unit_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Model & Category */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.model_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal dark:bg-slate-800 dark:text-slate-300">
                            {item.category}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-medium">{item.brand}</span>
                        </div>
                      </td>

                      {/* Serial No */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <QrCode className="w-3 h-3 text-slate-400" />
                          <span>{item.serial_no}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Installed: {item.installed_on}
                        </div>
                      </td>

                      {/* Customer & Location */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-200">{item.customer_name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{item.site_name}</span>
                        </div>
                      </td>

                      {/* AMC Status */}
                      <td className="py-3 px-4 text-center">
                        {item.amc_status === 'active' ? (
                          <div className="inline-flex flex-col items-center">
                            <Badge variant="success" className="text-[10px] px-2 py-0">
                              Active AMC
                            </Badge>
                            <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {item.amc_contract_no}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-2 py-0 text-slate-400 dark:border-slate-700">
                            No AMC
                          </Badge>
                        )}
                      </td>

                      {/* Warranty End */}
                      <td className="py-3 px-4 text-center">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.warranty_end}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(item.warranty_end) > now ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Valid</span>
                          ) : (
                            <span className="text-slate-400">Expired</span>
                          )}
                        </div>
                      </td>

                      {/* Operational Status */}
                      <td className="py-3 px-4 text-right">
                        {item.operational_status === 'operational' ? (
                          <Badge variant="success" className="text-[10px] font-medium">
                            Operational
                          </Badge>
                        ) : item.operational_status === 'needs_service' ? (
                          <Badge variant="warning" className="text-[10px] font-medium">
                            PM Due
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] font-medium">
                            Repair Needed
                          </Badge>
                        )}
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
