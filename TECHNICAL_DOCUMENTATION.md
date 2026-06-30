# Confessions Wall | Technical Documentation

TxODDS Consumer and Fan Experiences Hackathon
Live app: https://confessions-wall.vercel.app
Repo: https://github.com/DaAyara/confessions-wall

---

## Core Idea

Confessions Wall allows fans post hot takes (predictions) on live World Cup matches. Each take is automatically graded as correct, wrong, or still pending by checking it against live match data from TxLINE. Predictions lock once a match kicks off, so nobody can post a "prediction" after already watching the result unfold. Graded takes can be shared directly to X with full match context, and a leaderboard tracks every player's record across all matches.

---

## Why This Matters

Fan predictions and trash talk already happen constantly during tournaments, but they live and die inside group chats with no record, no accountability, and no shareable moment. Confessions Wall gives that informal behavior a home, a live feed that grades itself, and a built-in reason to share back to social media, which drives organic reach without any ad spend.

---

## Architecture

- **Frontend & backend:** Next.js (App Router), deployed on Vercel
- **Database:** Supabase (Postgres) for storing confessions, with real-time subscriptions so the wall updates live across all open tabs without polling
- **Live data:** TxLINE API (devnet, free World Cup tier) for fixtures and scores
- **Auth flow:** Solana on-chain subscription using a generated keypair, activated through TxLINE's guest JWT + API token flow

---

## TxLINE Endpoints Used

- `POST /auth/guest/start` - generates the guest JWT required for every data request
- `GET /api/fixtures/snapshot` - pulls all upcoming and live World Cup fixtures, filtered by competition name
- `GET /api/scores/snapshot` - pulls live scores per fixture, polled every 30 seconds on each match page to drive the grading engine
- On-chain: `program.methods.subscribe()` (service level 1, free World Cup tier) and `POST /api/token/activate` to activate the API token after subscribing

---

## Grading Engine

The grading logic runs client-side on each match page poll. It checks each pending confession's text against the live score and match minute, matching against several prediction patterns:

- Win predictions ("will win," "beats," "wins this")
- No-goal predictions ("won't score," "clean sheet," "no goals")
- Draw predictions ("draw," "level," "will tie")
- Exact scoreline predictions (e.g. "2-1")
- Over/under goal totals ("over 2 goals," "under 3 goals")

---

## Prediction Lock

Each match card carries its TxLINE kickoff timestamp through to the match page. Once the current time passes that kickoff timestamp, the confession form is replaced with a locked message and no further takes can be submitted for that match. This prevents fans from posting "predictions" after a match has already started and the outcome is partly or fully visible, keeping the leaderboard meaningful.

---

## Leaderboard Logic

The leaderboard aggregates every graded confession across every match per author name. A fan can post multiple takes on the same match (e.g. predicting the winner, the first scorer, and the exact scoreline separately), and each graded take counts individually toward their win/loss total. This was a deliberate choice to reward engagement and depth of prediction, not just one-shot accuracy. The leaderboard surfaces total correct calls (W), wrong calls (L), and pending calls (P) per fan.

---

## Core User Flow

1. Fan opens the homepage and sees live/upcoming World Cup fixtures pulled from TxLINE
2. Fan taps into a match before kickoff and posts one or more takes with their name
3. Take appears instantly on the wall (Supabase real-time) with a pending badge
4. Once kickoff passes, the form locks and no further takes can be added for that match
5. As the match progresses, TxLINE score data is polled and the grading engine updates each take's status automatically
6. Fan can share any graded take to X with full match context
7. Leaderboard aggregates every fan's win/loss record across all matches