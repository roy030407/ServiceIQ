import React from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Package } from 'lucide-react';
import { PartsClient } from './parts-client';
import type { Part } from '@/types';

export const revalidate = 0;

export default async function PartsPage() {
  const supabase = createClient();

  // Demo fallback parts catalog
  let parts: Part[] = [
    {
      part_id: 'p1',
      org_id: '00000000-0000-0000-0000-000000000001',
      part_no: 'AC-COMP-15T',
      name: 'Rotary Compressor 1.5 Ton (R32)',
      uom: 'piece',
      sell_price: 6850.0,
    },
    {
      part_id: 'p2',
      org_id: '00000000-0000-0000-0000-000000000001',
      part_no: 'AC-CAP-45UF',
      name: 'Dual Run Capacitor 45+5 uF',
      uom: 'piece',
      sell_price: 450.0,
    },
    {
      part_id: 'p3',
      org_id: '00000000-0000-0000-0000-000000000001',
      part_no: 'GAS-R32-KG',
      name: 'R32 Refrigerant Gas Canister',
      uom: 'kg',
      sell_price: 850.0,
    },
    {
      part_id: 'p4',
      org_id: '00000000-0000-0000-0000-000000000001',
      part_no: 'LFT-CBL-12MM',
      name: 'Steel Traction Cable 12mm',
      uom: 'metre',
      sell_price: 320.0,
    },
    {
      part_id: 'p5',
      org_id: '00000000-0000-0000-0000-000000000001',
      part_no: 'DG-FLT-OIL-HD',
      name: 'Heavy Duty Lube Oil Filter',
      uom: 'piece',
      sell_price: 1250.0,
    },
  ];

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('part')
        .select('*')
        .order('name');

      if (data && data.length > 0) {
        parts = data as Part[];
      }
    } catch (err) {
      console.warn('Using default demo parts catalogue:', err);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Spare Parts Catalogue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Catalog of spare parts and standard prices. Technicians use these during job closeout to calculate AMC coverage or chargeable invoices.
        </p>
      </div>

      <PartsClient initialParts={parts} orgId="00000000-0000-0000-0000-000000000001" />
    </div>
  );
}
