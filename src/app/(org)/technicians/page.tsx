import React from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TechniciansClient, TechnicianItem } from './technicians-client';

export const revalidate = 0;

export default async function TechniciansPage() {
  const supabase = createClient();

  // Demo fallback list
  let technicians: TechnicianItem[] = [
    {
      person_id: 'tech-1',
      full_name: 'Lead Specialist A',
      phone: '+91 98XXX XXXXX',
      base_city: 'Metro Region 1',
      emp_code: 'TEC-101',
      is_active: true,
      skills: [
        { name: 'HVAC / Air Conditioning', level: 'expert' },
        { name: 'Electrical', level: 'competent' },
      ],
      avg_rating: 4.8,
      jobs_assigned: 45,
      jobs_completed: 43,
      sla_breaches: 1,
    },
    {
      person_id: 'tech-2',
      full_name: 'Senior Technician B',
      phone: '+91 98XXX XXXXX',
      base_city: 'Metro Region 2',
      emp_code: 'TEC-102',
      is_active: true,
      skills: [
        { name: 'Lift / Elevator', level: 'expert' },
        { name: 'Fire Safety', level: 'competent' },
      ],
      avg_rating: 4.6,
      jobs_assigned: 38,
      jobs_completed: 35,
      sla_breaches: 2,
    },
    {
      person_id: 'tech-3',
      full_name: 'Field Technician C',
      phone: '+91 98XXX XXXXX',
      base_city: 'Metro Region 3',
      emp_code: 'TEC-103',
      is_active: true,
      skills: [
        { name: 'Diesel Generator', level: 'competent' },
        { name: 'General Appliances', level: 'trainee' },
      ],
      avg_rating: 4.3,
      jobs_assigned: 29,
      jobs_completed: 27,
      sla_breaches: 3,
    },
    {
      person_id: 'tech-4',
      full_name: 'Field Technician D',
      phone: '+91 98XXX XXXXX',
      base_city: 'Metro Region 1',
      emp_code: 'TEC-104',
      is_active: true,
      skills: [{ name: 'HVAC / Air Conditioning', level: 'competent' }],
      avg_rating: 4.7,
      jobs_assigned: 32,
      jobs_completed: 31,
      sla_breaches: 0,
    },
  ];

  if (isSupabaseConfigured()) {
    try {
      const { data: members } = await supabase
      .from('org_membership')
      .select(`
        membership_id,
        role,
        emp_code,
        is_active,
        person (
          person_id,
          full_name,
          phone,
          base_city,
          person_skill (
            level,
            certified_until,
            skill (
              name
            )
          )
        )
      `)
      .eq('role', 'technician')
      .eq('is_active', true);

    const { data: perf } = await supabase
      .from('v_technician_performance')
      .select('*');

    if (members && members.length > 0) {
      const perfMap = new Map((perf || []).map((p: any) => [p.person_id, p]));

      technicians = members.map((m: any) => {
        const p = m.person;
        const performance = perfMap.get(p?.person_id) || {};
        const skills = (p?.person_skill || []).map((ps: any) => ({
          name: ps.skill?.name || 'General Maintenance',
          level: ps.level || 'competent',
        }));

        return {
          person_id: p?.person_id || m.membership_id,
          full_name: p?.full_name || 'Technician',
          phone: p?.phone || 'N/A',
          base_city: p?.base_city || 'HQ',
          emp_code: m.emp_code || 'EMP',
          is_active: m.is_active,
          skills,
          avg_rating: performance.avg_rating ? Number(performance.avg_rating) : null,
          jobs_assigned: Number(performance.jobs_assigned || 0),
          jobs_completed: Number(performance.jobs_completed || 0),
          sla_breaches: Number(performance.sla_breaches || 0),
        };
      });
    }
    } catch (err) {
      console.warn('TechniciansPage using fallback data:', err);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Field Technicians Roster
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active workforce skills, job assignments, SLA compliance, and customer satisfaction.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold dark:border-slate-800 dark:text-slate-300">
            {technicians.length} Active Field Agents
          </Badge>
        </div>
      </div>

      {/* Main Table Card with interactive search & filters */}
      <TechniciansClient initialTechnicians={technicians} />
    </div>
  );
}
