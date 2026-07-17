-- Optional Supabase mirror for waitlist email alert subscribers
-- (Firestore waitlist_alert_subscribers is the primary store when Firebase is enabled.)

CREATE TABLE IF NOT EXISTS waitlist_alert_subscribers (
  email TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE waitlist_alert_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY waitlist_alert_subscribers_insert
  ON waitlist_alert_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (active = true);

CREATE POLICY waitlist_alert_subscribers_update
  ON waitlist_alert_subscribers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
