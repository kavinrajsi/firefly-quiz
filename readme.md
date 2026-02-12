# Firefly — Interactive Quiz Platform

A real-time multiplayer quiz application for corporate training, built with Next.js 14, Tailwind CSS, and Supabase.

## Features

- **Quiz Management** — Create, edit, duplicate, and delete quizzes with multiple-choice questions
- **Live Sessions** — Host real-time quiz sessions with unique 6-character room codes
- **Player Experience** — Players join via room code, answer questions with color-coded buttons, earn speed-based points
- **Real-time Sync** — Timer sync, live answer counts, and instant leaderboard updates via Supabase Realtime
- **Scoring** — Speed-based scoring (500-1000 points per correct answer)
- **Results & Analytics** — Post-game leaderboards, per-question breakdowns, CSV export
- **Media Support** — Upload images/videos to questions via Supabase Storage
- **Auth** — Email/password authentication with protected routes

## Tech Stack

- **Frontend**: Next.js 14 (App Router, JavaScript)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase/schema.sql`
3. This creates all tables, indexes, RLS policies, functions, and the storage bucket

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key-here
```

Find these values in your Supabase project: Settings > API.

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### For Hosts

1. Sign up and create a quiz from the dashboard
2. Add questions with 4 multiple-choice options, set the correct answer and time limit
3. Click "Host Live" to start a session — a 6-character room code is generated
4. Share the room code with players
5. Control the flow: Start Quiz > Show Results > Next Question > End Quiz
6. View results and export to CSV

### For Players

1. Go to `/play` and enter the room code + a nickname
2. Wait for the host to start the quiz
3. Answer questions within the time limit using color-coded buttons
4. See instant feedback (correct/wrong, points earned)
5. View the leaderboard after each question
6. See final rankings when the game ends

### Scoring

- Correct answers earn 500-1000 points based on speed
- Formula: `1000 * (1 - (time_taken / time_limit) * 0.5)`
- Fastest correct answer: 1000 points. Slowest: 500 points
- Wrong answers: 0 points

## Project Structure

```
├── supabase/schema.sql          # Database schema + RLS policies
├── middleware.js                 # Auth route protection
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── auth/                # Login/signup
│   │   ├── dashboard/           # Quiz management + analytics
│   │   ├── quiz/                # Create/edit quizzes
│   │   ├── host/                # Host live session
│   │   ├── play/                # Player join + game
│   │   └── results/             # Post-game results
│   ├── components/              # React components
│   │   ├── ui/                  # Button, Input, Modal, Timer, Spinner
│   │   ├── auth/                # AuthForm
│   │   ├── quiz/                # QuestionEditor, QuestionCard, MediaUpload
│   │   ├── host/                # ParticipantList, AnswerDistribution, etc.
│   │   ├── play/                # JoinForm, AnswerButtons, etc.
│   │   └── shared/              # Navbar, Countdown, LeaderboardDisplay
│   └── lib/                     # Utilities
│       ├── supabase/            # Supabase client/server/middleware
│       ├── scoring.js           # Points calculation
│       └── utils.js             # Room code gen, CSV export, etc.
```

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
4. Deploy

## Database Schema

| Table | Purpose |
|-------|---------|
| `quizzes` | Quiz metadata (title, description, owner) |
| `questions` | Questions with options, correct answer, time limit, media |
| `quiz_sessions` | Live sessions with room code and status |
| `participants` | Players who joined a session |
| `answers` | Individual answer submissions with timing and points |
