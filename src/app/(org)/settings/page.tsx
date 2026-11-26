import React from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Settings } from 'lucide-react';
import { SettingsClient } from './settings-client';

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = createClient();

  const orgConfig = {
    orgName: 'ServiceIQ Enterprise',
    orgType: 'service_centre',
    dayStart: '09:00',
    dayEnd: '18:00',
    workingDays: 'Mon,Tue,Wed,Thu,Fri,Sat',
    phoneId: process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_PHONE_ID !== 'your-whatsapp-phone-id'
      ? process.env.WHATSAPP_PHONE_ID
      : '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_VERIFY_TOKEN !== 'your-webhook-verify-token'
      ? '••••••••••••••••'
      : '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  };

  if (isSupabaseConfigured()) {
    try {
      const { data: org } = await supabase
        .from('organisation')
        .select('name, org_type, day_start, day_end, working_days')
        .limit(1)
        .maybeSingle();

      if (org) {
        orgConfig.orgName = org.name || orgConfig.orgName;
        orgConfig.orgType = org.org_type || orgConfig.orgType;
        orgConfig.dayStart = org.day_start || orgConfig.dayStart;
        orgConfig.dayEnd = org.day_end || orgConfig.dayEnd;
        orgConfig.workingDays = org.working_days || orgConfig.workingDays;
      }
    } catch (err) {
      console.warn('Settings using default org config:', err);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Settings & Communication Gateway
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage organisation profile, SLA targets, and Meta WhatsApp Business Cloud API parameters.
        </p>
      </div>

      <SettingsClient initialConfig={orgConfig} />
    </div>
  );
}
