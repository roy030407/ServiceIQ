import React from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  Users,
  Star,
  Phone,
  MapPin,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const revalidate = 0;

export default async function TechniciansPage() {
  const supabase = createClient();

  // Demo fallback list
  let technicians: Array<{
    person_id: string;
    full_name: string;
    phone: string;
    base_city: string;
    emp_code: string;
    is_active: boolean;
    skills: Array<{ name: string; level: string }>;
    avg_rating: number | null;
    jobs_assigned: number;
    jobs_completed: number;
    sla_breaches: number;
  }> = [
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

      {/* Main Table Card */}
      <Card className="shadow-xs border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Performance & Capabilities</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Verified field metrics and customer ratings
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 w-64 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, skill, or city..."
              className="bg-transparent border-none outline-none text-slate-900 dark:text-white w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Contact & Base</th>
                  <th className="py-3 px-4">Skills & Certifications</th>
                  <th className="py-3 px-4 text-center">Avg Rating</th>
                  <th className="py-3 px-4 text-center">Completed / Assigned</th>
                  <th className="py-3 px-4 text-center">SLA Breaches</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {technicians.map((t) => (
                  <tr key={t.person_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.emp_code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{t.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-0.5 text-[11px]">
                        <MapPin className="w-3 h-3" />
                        <span>{t.base_city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {t.skills.map((s, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px] px-2 py-0 font-normal"
                          >
                            {s.name} ({s.level})
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                      {t.avg_rating ? (
                        <span className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {t.avg_rating}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-[11px]">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-slate-900 dark:text-white">{t.jobs_completed}</span>
                      <span className="text-slate-400 text-[11px]"> / {t.jobs_assigned}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.sla_breaches > 0 ? (
                        <Badge variant="destructive" className="text-[10px] px-2 py-0">
                          {t.sla_breaches}
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] px-2 py-0">
                          0
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant="success" className="text-[10px] font-medium">
                        Available
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
