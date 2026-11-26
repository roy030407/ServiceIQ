'use client';

import React, { useState } from 'react';
import {
  Star,
  Phone,
  MapPin,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface TechnicianItem {
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
}

interface TechniciansClientProps {
  initialTechnicians: TechnicianItem[];
}

export function TechniciansClient({ initialTechnicians }: TechniciansClientProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'top_rated' | 'sla_clean'>('all');

  const filteredTechnicians = initialTechnicians.filter((t) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.full_name.toLowerCase().includes(q) ||
      t.emp_code.toLowerCase().includes(q) ||
      t.base_city.toLowerCase().includes(q) ||
      t.skills.some((s) => s.name.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filter === 'top_rated') return (t.avg_rating || 0) >= 4.5;
    if (filter === 'sla_clean') return t.sla_breaches === 0;

    return true;
  });

  return (
    <Card className="shadow-xs border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
            Performance & Capabilities
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Verified field metrics, active skillsets, and customer ratings ({filteredTechnicians.length} shown)
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('top_rated')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                filter === 'top_rated'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Top Rated (4.5+)
            </button>
            <button
              type="button"
              onClick={() => setFilter('sla_clean')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === 'sla_clean'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Zero Breaches
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 w-full sm:w-64 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, skill, or city..."
              className="bg-transparent border-none outline-none text-slate-900 dark:text-white w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
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
              {filteredTechnicians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No technicians match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTechnicians.map((t) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
