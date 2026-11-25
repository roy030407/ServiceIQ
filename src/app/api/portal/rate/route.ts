import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { token, rating, feedback } = await req.json();

    if (!token || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid parameters. Token and rating (1-5) are required.' },
        { status: 400 }
      );
    }

    // Support offline development preview
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Review recorded successfully (local preview mode).',
      });
    }

    const supabase = createAdminClient();

    // Securely resolve ticket and its job from public_token
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select(`
        ticket_id,
        public_token,
        job (
          job_id,
          customer_rating
        )
      `)
      .eq('public_token', token)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    const jobs = Array.isArray(ticket.job) ? ticket.job : ticket.job ? [ticket.job] : [];
    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'No active or completed job found for this ticket.' },
        { status: 404 }
      );
    }

    // Update the most relevant job (first or latest)
    const targetJob = jobs[0];

    const { error: updateError } = await supabase
      .from('job')
      .update({
        customer_rating: rating,
        customer_feedback: feedback || null,
      })
      .eq('job_id', targetJob.job_id);

    if (updateError) {
      console.error('Failed to submit rating:', updateError);
      return NextResponse.json(
        { error: 'Failed to record rating.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Rating saved successfully.' });
  } catch (error) {
    console.error('Error handling rating submission:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
