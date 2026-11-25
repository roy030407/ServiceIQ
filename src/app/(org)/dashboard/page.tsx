import React from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { AnimatedDashboard } from '@/components/dashboard/animated-dashboard';

export const revalidate = 0; // Fresh KPIs on load

export default async function DashboardPage() {
  const supabase = createClient();

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const todayStr = now.toISOString().split('T')[0];

  const stats = {
    openTickets: 12,
    jobsInProgress: 7,
    slaBreaches: 3,
    pmVisitsDueThisMonth: 18,
    revenueAtRisk: 245000,
    avgRating: 4.6,
  };

  let recentBreaches = [
    {
      job_id: 'job-1',
      job_no: 'JOB-01042',
      ticket_no: 'TKT-01031',
      resolution_due: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'On Site',
      tech_name: 'Field Technician A',
    },
    {
      job_id: 'job-2',
      job_no: 'JOB-01038',
      ticket_no: 'TKT-01028',
      resolution_due: new Date(Date.now() - 3600000 * 8).toISOString(),
      status: 'En Route',
      tech_name: 'Field Technician B',
    },
    {
      job_id: 'job-3',
      job_no: 'JOB-01035',
      ticket_no: 'TKT-01022',
      resolution_due: new Date(Date.now() - 3600000 * 14).toISOString(),
      status: 'Awaiting Parts',
      tech_name: 'Field Technician C',
    },
  ];

  let overduePMVisits = [
    {
      pm_visit_id: 'pm-1',
      contract_no: 'AMC-2026-089',
      due_date: '2026-10-25',
      grace_days: 15,
      status: 'pending',
    },
    {
      pm_visit_id: 'pm-2',
      contract_no: 'AMC-2026-104',
      due_date: '2026-10-28',
      grace_days: 15,
      status: 'pending',
    },
    {
      pm_visit_id: 'pm-3',
      contract_no: 'AMC-2026-062',
      due_date: '2026-11-01',
      grace_days: 15,
      status: 'pending',
    },
  ];

  let upcomingRenewals = [
    {
      contract_id: 'c1',
      contract_no: 'AMC-2026-0042',
      customer_name: 'Commercial Facility A',
      customer_phone: '+91 98XXX XXXXX',
      valid_to: '2026-11-20',
      days_until_expiry: 17,
      annual_value: 120000,
    },
    {
      contract_id: 'c2',
      contract_no: 'AMC-2026-0058',
      customer_name: 'Commercial Facility B',
      customer_phone: '+91 98XXX XXXXX',
      valid_to: '2026-11-28',
      days_until_expiry: 25,
      annual_value: 75000,
    },
    {
      contract_id: 'c3',
      contract_no: 'AMC-2026-0081',
      customer_name: 'Commercial Facility C',
      customer_phone: '+91 98XXX XXXXX',
      valid_to: '2026-12-15',
      days_until_expiry: 42,
      annual_value: 50000,
    },
  ];

  if (isSupabaseConfigured()) {
    try {
      const [ticketsRes, jobsRes, pmVisitsRes, renewalsRes, breachesRes, overduePmRes, perfRes] =
        await Promise.all([
        supabase.from('ticket').select('ticket_id, status', { count: 'exact' }).neq('status', 'closed'),
        supabase.from('job').select('job_id, breached, workflow_state(is_terminal)', { count: 'exact' }),
        supabase.from('pm_visit').select('pm_visit_id', { count: 'exact' }).eq('status', 'pending').lte('due_date', thirtyDaysFromNow),
        supabase.from('v_renewal_pipeline').select('*'),
        supabase
          .from('job')
          .select(`
            job_id,
            job_no,
            resolution_due,
            workflow_state (label),
            ticket (ticket_no),
            job_assignment (
              person (full_name)
            )
          `)
          .eq('breached', true)
          .order('resolution_due', { ascending: false })
          .limit(10),
        supabase
          .from('pm_visit')
          .select(`
            pm_visit_id,
            due_date,
            grace_days,
            status,
            contract_equipment (
              contract (contract_no)
            )
          `)
          .eq('status', 'pending')
          .lt('due_date', todayStr)
          .order('due_date', { ascending: true })
          .limit(10),
        supabase.from('v_technician_performance').select('avg_rating'),
      ]);

    if (ticketsRes.count !== null && ticketsRes.count !== undefined) {
      stats.openTickets = ticketsRes.count;
    }

    if (jobsRes.data) {
      stats.jobsInProgress = jobsRes.data.filter(
        (j: any) => !j.workflow_state?.is_terminal
      ).length;
      stats.slaBreaches = jobsRes.data.filter((j: any) => j.breached).length;
    }

    if (pmVisitsRes.count !== null && pmVisitsRes.count !== undefined) {
      stats.pmVisitsDueThisMonth = pmVisitsRes.count;
    }

    if (renewalsRes.data && renewalsRes.data.length > 0) {
      const expiringIn30 = renewalsRes.data.filter((r: any) => Number(r.days_until_expiry) <= 30);
      stats.revenueAtRisk = expiringIn30.reduce(
        (acc: number, item: any) => acc + (Number(item.annual_value) || 0),
        0
      );
      upcomingRenewals = renewalsRes.data.map((r: any) => ({
        contract_id: r.contract_id,
        contract_no: r.contract_no,
        customer_name: r.customer_name,
        customer_phone: r.customer_phone,
        valid_to: r.valid_to,
        days_until_expiry: Number(r.days_until_expiry),
        annual_value: Number(r.annual_value),
      }));
    }

    if (perfRes.data && perfRes.data.length > 0) {
      const validRatings = perfRes.data
        .map((p: any) => Number(p.avg_rating))
        .filter((r: number) => !isNaN(r) && r > 0);
      if (validRatings.length > 0) {
        stats.avgRating =
          Math.round(
            (validRatings.reduce((a: number, b: number) => a + b, 0) / validRatings.length) * 10
          ) / 10;
      }
    }

    if (breachesRes.data && breachesRes.data.length > 0) {
      recentBreaches = breachesRes.data.map((j: any) => ({
        job_id: j.job_id,
        job_no: j.job_no,
        ticket_no: j.ticket?.ticket_no || 'N/A',
        resolution_due: j.resolution_due,
        status: j.workflow_state?.label || 'Open',
        tech_name: j.job_assignment?.[0]?.person?.full_name || 'Unassigned',
      }));
    }

    if (overduePmRes.data && overduePmRes.data.length > 0) {
      overduePMVisits = overduePmRes.data.map((p: any) => ({
        pm_visit_id: p.pm_visit_id,
        contract_no: p.contract_equipment?.contract?.contract_no || 'AMC-Direct',
        due_date: p.due_date,
        grace_days: p.grace_days,
        status: p.status,
      }));
    }
    } catch (error) {
      console.warn('Dashboard using fallback stats:', error);
    }
  }

  return (
    <AnimatedDashboard
      initialStats={stats}
      initialBreaches={recentBreaches}
      initialOverduePMs={overduePMVisits}
      initialRenewals={upcomingRenewals}
    />
  );
}
