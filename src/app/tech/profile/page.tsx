import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, isBefore, startOfDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { OfflineBanner } from '@/components/tech/offline-banner'
import Link from 'next/link'
import { ArrowLeft, Star, Award, ShieldAlert, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TechProfilePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: person } = await supabase
    .from('person')
    .select('person_id, full_name, phone, email, base_city')
    .eq('auth_user_id', user.id)
    .single()

  if (!person) redirect('/onboard')

  const [{ data: skills }, { data: perf }] = await Promise.all([
    supabase
      .from('person_skill')
      .select(`
        person_skill_id, level, cert_number, certified_from, certified_until,
        skill(name, requires_certification)
      `)
      .eq('person_id', person.person_id),
    supabase
      .from('v_technician_performance')
      .select('jobs_assigned, jobs_completed, avg_rating, sla_breaches, completion_rate_pct')
      .eq('person_id', person.person_id)
      .maybeSingle(),
  ])

  const today = startOfDay(new Date())
  const avgRating = perf?.avg_rating ? Number(perf.avg_rating) : 0

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <OfflineBanner />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link
          href="/tech"
          aria-label="Back to My Jobs"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Technician Profile</h1>
          <p className="text-xs text-slate-500">{person.full_name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 pt-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">{person.full_name}</h2>
          <p className="text-sm text-slate-500">
            {person.phone || person.email}
            {person.base_city ? ` • ${person.base_city}` : ''}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-base font-bold text-slate-900">
              {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings yet'}
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Performance Summary
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {perf?.jobs_completed ?? 0}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">Completed</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {perf?.completion_rate_pct != null ? `${perf.completion_rate_pct}%` : '—'}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">Completion</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {perf?.sla_breaches ?? 0}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">SLA Breaches</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Award className="h-4 w-4" />
            <span>Skills & Certifications</span>
          </div>

          {!skills || skills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No skills or certifications assigned yet.
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((item: any) => {
                const isExpired =
                  item.certified_until &&
                  isBefore(new Date(item.certified_until), today)

                return (
                  <div
                    key={item.person_skill_id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          {item.skill?.name ?? 'Skill'}
                        </h4>
                        {item.level && (
                          <p className="mt-0.5 text-xs font-medium capitalize text-slate-500">
                            Level: {item.level}
                          </p>
                        )}
                      </div>

                      {item.certified_until ? (
                        isExpired ? (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Expired
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Valid
                          </Badge>
                        )
                      ) : null}
                    </div>

                    {(item.cert_number || item.certified_until) && (
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                        <div>
                          <span className="text-slate-400">Cert Number</span>
                          <p className="font-mono font-semibold text-slate-800">
                            {item.cert_number || '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Valid Until</span>
                          <p
                            className={`font-semibold ${
                              isExpired ? 'text-red-600' : 'text-slate-800'
                            }`}
                          >
                            {item.certified_until
                              ? format(new Date(item.certified_until), 'dd MMM yyyy')
                              : '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
