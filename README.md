# ABCEMOM

A lightweight kettlebell EMOM timer built with Next.js and TypeScript.

## What it does

- Provides a full-screen EMOM (every minute on the minute) workout timer.
- Supports single and double kettlebell ABC-style (Armour Building Complex) rounds.
- Lets users choose preset round counts or type a custom round count.
- Displays total workout time, active round, and countdown seconds.
- Uses browser audio to beep at each minute and in the final countdown.
- Works entirely client-side with no backend required.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- CSS-in-JSX styling inside `app/page.tsx`
- Web Audio API for timer beeps

## Getting started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for production

```bash
npm run build
```

You can also run the production server locally after building:

```bash
npm run start
```

## Notes

- The workout configuration and timer logic are implemented in `app/page.tsx`.
- Custom round input is sanitized to digits only.
- There are no server-side APIs or external data dependencies in this app.



## Open source

This repository is released under the MIT License. Contributions are welcome via pull request.
