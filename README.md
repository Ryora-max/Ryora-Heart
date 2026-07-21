# RYORA - HeartSync • Our Home

A private digital home for two hearts in love. Built with Next.js 15, TypeScript, Tailwind CSS, GSAP, and Supabase.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Run the SQL migration in Supabase SQL Editor:
   - Open `supabase/migrations/20240101000000_initial_schema.sql`
   - Copy and paste into Supabase Dashboard → SQL Editor
   - Run the migration

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

- `profiles` - User profiles (owner/partner)
- `moods` - Daily mood entries
- `activities` - Shared activities and schedules
- `gallery` - Photo memories
- `letters` - Love letters and open-when letters
- `calendar_events` - Special dates and reminders

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- GSAP + ScrollTrigger
- Supabase (Auth + Database + Storage)
- Zustand (State Management)
- Lucide React (Icons)

## Deployment

Deploy to Vercel:
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
