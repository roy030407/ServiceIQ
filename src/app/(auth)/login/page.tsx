import React from 'react';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          ServiceIQ Platform
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Field service & AMC management login
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl sm:px-10">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Work Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 py-2.5 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <Button type="button" className="w-full text-xs font-semibold flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> Send Magic Link
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center gap-1"
            >
              Access ServiceIQ Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
