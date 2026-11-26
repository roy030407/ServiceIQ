'use client';

import React, { useState } from 'react';
import { Star, CheckCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RatingForm({ token }: { token: string }) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, feedback }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit rating.');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center">
        <CheckCircle className="w-10 h-10 text-emerald-600 mb-2" />
        <h4 className="text-base font-bold text-emerald-900">Thank you for your feedback!</h4>
        <p className="text-xs text-emerald-700 mt-1">
          Your rating has been recorded and helps us maintain quality service.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Rate your service experience</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          How satisfied were you with the technician and the repair?
        </p>
      </div>

      {/* Star Selector */}
      <div className="flex items-center gap-1.5 py-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 text-slate-300 dark:text-slate-600 hover:scale-110 transition-transform focus:outline-none"
          >
            <Star
              className={`w-7 h-7 ${
                (hoverRating || rating) >= star
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-200 dark:text-slate-700'
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
        </span>
      </div>

      {/* Comments */}
      <div>
        <label htmlFor="feedback" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Additional comments (optional)
        </label>
        <textarea
          id="feedback"
          rows={3}
          maxLength={1000}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Technician arrived on time, resolved the issue quickly..."
          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full text-xs font-semibold flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5" /> Submit Review
          </>
        )}
      </Button>
    </form>
  );
}
