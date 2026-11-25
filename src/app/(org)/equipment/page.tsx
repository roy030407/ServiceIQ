import React from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Wrench } from 'lucide-react';
import { EquipmentClient, type EquipmentItem } from './equipment-client';

export const revalidate = 0;

export default async function EquipmentPage() {
  const supabase = createClient();

  // Demo fallback equipment base
  let equipmentList: EquipmentItem[] = [
    {
      unit_id: 'eq-1',
      model_name: 'Daikin Inverter Split AC 1.5T (FTKF50)',
      serial_no: 'SN-DKN-90214',
      category: 'HVAC',
      brand: 'Daikin',
      site_name: 'Tower A — Server Room 3',
      customer_name: 'Commercial Facility A',
      installed_on: '2025-03-12',
      warranty_end: '2027-03-11',
      amc_status: 'active',
      amc_contract_no: 'AMC-2026-0042',
      last_service_date: '2026-09-15',
      operational_status: 'operational',
    },
    {
      unit_id: 'eq-2',
      model_name: 'Otis Gen2 Passenger Elevator (G+8)',
      serial_no: 'OTIS-ELV-4012',
      category: 'Elevators',
      brand: 'Otis',
      site_name: 'West Wing Main Lobby',
      customer_name: 'Commercial Facility B',
      installed_on: '2024-06-20',
      warranty_end: '2026-06-19',
      amc_status: 'active',
      amc_contract_no: 'AMC-2026-0058',
      last_service_date: '2026-10-10',
      operational_status: 'operational',
    },
    {
      unit_id: 'eq-3',
      model_name: 'Kirloskar Silent Diesel Generator 25 kVA',
      serial_no: 'KRL-DG-8812',
      category: 'Generators',
      brand: 'Kirloskar',
      site_name: 'Basement Substation B2',
      customer_name: 'Commercial Facility A',
      installed_on: '2023-11-05',
      warranty_end: '2025-11-04',
      amc_status: 'active',
      amc_contract_no: 'AMC-2026-0042',
      last_service_date: '2026-08-22',
      operational_status: 'needs_service',
    },
    {
      unit_id: 'eq-4',
      model_name: 'Carrier 30XA AquaForce Air-Cooled Chiller 100TR',
      serial_no: 'CAR-CHL-1092',
      category: 'Chillers',
      brand: 'Carrier',
      site_name: 'Central Plant Rooftop',
      customer_name: 'Commercial Facility C',
      installed_on: '2024-01-18',
      warranty_end: '2027-01-17',
      amc_status: 'active',
      amc_contract_no: 'AMC-2026-0081',
      last_service_date: '2026-10-02',
      operational_status: 'operational',
    },
    {
      unit_id: 'eq-5',
      model_name: 'Blue Star Cassette AC 2.0 Ton (Inverter)',
      serial_no: 'BLS-CST-6721',
      category: 'HVAC',
      brand: 'Blue Star',
      site_name: 'Executive Boardroom 1',
      customer_name: 'Commercial Facility B',
      installed_on: '2023-05-14',
      warranty_end: '2025-05-13',
      amc_status: 'none',
      last_service_date: '2026-04-11',
      operational_status: 'operational',
    },
    {
      unit_id: 'eq-6',
      model_name: 'Schneider Electric Automatic Transfer Switch 400A',
      serial_no: 'SCH-ATS-3301',
      category: 'Electrical',
      brand: 'Schneider',
      site_name: 'Power Control Room B1',
      customer_name: 'Commercial Facility A',
      installed_on: '2024-08-30',
      warranty_end: '2026-08-29',
      amc_status: 'active',
      amc_contract_no: 'AMC-2026-0042',
      last_service_date: '2026-09-20',
      operational_status: 'operational',
    },
  ];

  if (isSupabaseConfigured()) {
    try {
      const { data: units } = await supabase
        .from('equipment_unit')
        .select(`
          unit_id,
          serial_no,
          installed_on,
          warranty_end,
          status,
          product_model (
            name,
            model_no,
            brand_id
          ),
          site (
            name
          )
        `)
        .order('installed_on', { ascending: false });

      if (units && units.length > 0) {
        equipmentList = units.map((u: any) => ({
          unit_id: u.unit_id,
          model_name: u.product_model?.name || 'General Equipment',
          serial_no: u.serial_no || 'SN-UNKNOWN',
          category: 'Equipment',
          brand: 'Verified Brand',
          site_name: u.site?.name || 'HQ Facility',
          customer_name: 'Client Account',
          installed_on: u.installed_on || '2025-01-01',
          warranty_end: u.warranty_end || '2027-01-01',
          amc_status: 'active',
          amc_contract_no: 'AMC-2026-ACTIVE',
          last_service_date: '2026-10-01',
          operational_status: 'operational',
        }));
      }
    } catch (err) {
      console.warn('EquipmentPage using demo fallback:', err);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Equipment Catalogue & Installed Base
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registered client assets, serialized equipment models, warranty tracking, and active maintenance contracts.
        </p>
      </div>

      <EquipmentClient initialEquipment={equipmentList} orgId="00000000-0000-0000-0000-000000000001" />
    </div>
  );
}
