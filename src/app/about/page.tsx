import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
};

export default function AboutPage() {
  return (
    <div className="animate-fadeUp space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">About</h1>
        <p className="text-sm text-muted">What {SITE_NAME} does, and how it works.</p>
      </div>

      <div className="card space-y-4 p-5 sm:p-6">
        <section>
          <h2 className="font-display text-base font-semibold">What this is</h2>
          <p className="mt-2 text-sm text-muted">
            {SITE_NAME} is an independent dashboard that watches the DonutLuck rain event and
            tells you the moment it starts. It polls the public rain-state endpoint in the
            background, keeps a live countdown running smoothly in your browser, and can alert
            you with a notification and an alarm sound so you don't have to keep a tab open and
            watch it yourself.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base font-semibold">Where the data comes from</h2>
          <p className="mt-2 text-sm text-muted">
            Every few seconds this site asks its own server for the latest rain state, which in
            turn reads directly from DonutLuck's public API. Only four fields are used —
            whether rain is active, the time remaining, how many participants have joined, and
            the prize amount — because those are the only fields the API documents. Nothing is
            guessed or invented beyond that.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base font-semibold">Privacy</h2>
          <p className="mt-2 text-sm text-muted">
            Your alert preferences, theme, and any custom alarm sound you upload are stored only
            in this browser — in local storage and IndexedDB. Nothing is sent to a server except
            the periodic request for the current rain state.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base font-semibold">Not affiliated with DonutLuck</h2>
          <p className="mt-2 text-sm text-muted">
            This is a community-built tracker, not an official DonutLuck product. It has its own
            visual identity and is not endorsed by or connected to DonutLuck.
          </p>
        </section>
      </div>
    </div>
  );
}
