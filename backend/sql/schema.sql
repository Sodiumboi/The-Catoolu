DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    avatar_url  VARCHAR(255) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE characters (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    occupation    VARCHAR(255),
    game_type     VARCHAR(100) DEFAULT 'Classic (1920''s)',
    sheet_data    JSONB NOT NULL,
    portrait_data TEXT,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_characters_user_id ON characters(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Schema created successfully!' AS status;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token   ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);

-- ════════════════════════════════════════════════════════════
-- v1.5 Nyarlathotep — Campaign Social Layer
-- ════════════════════════════════════════════════════════════

-- ── Campaigns ────────────────────────────────────────────────
-- A campaign is a group created by a Keeper.
-- keeper_id references the user who created it — they always
-- have the 'keeper' role in campaign_members too.
CREATE TABLE IF NOT EXISTS campaigns (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  TEXT         DEFAULT '',
  keeper_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code  VARCHAR(10)  NOT NULL UNIQUE,
  -- Session Luck mode: Keeper rolls fresh Luck (3D6×5) for every player
  -- at the start of a session instead of using the creation-time value.
  session_luck_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Campaign Members ─────────────────────────────────────────
-- Join table linking users to campaigns.
-- role: 'keeper' (full control) or 'player' (participant)
-- A user can only appear once per campaign (UNIQUE constraint).
CREATE TABLE IF NOT EXISTS campaign_members (
  id           SERIAL PRIMARY KEY,
  campaign_id  INTEGER     NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id      INTEGER     NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  role         VARCHAR(10) NOT NULL DEFAULT 'player'
                           CHECK (role IN ('keeper', 'player')),
  character_id INTEGER     DEFAULT NULL REFERENCES characters(id) ON DELETE SET NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_joined_at TIMESTAMPTZ DEFAULT NULL,

  UNIQUE (campaign_id, user_id)
);

-- ── Messages ─────────────────────────────────────────────────
-- Persistent chat log for each campaign.
-- type: 'chat' | 'roll' | 'system'
-- content: plain text for chat/system, JSON string for roll results
-- user_id is NULL for system messages (no sender)
CREATE TABLE IF NOT EXISTS messages (
  id           SERIAL PRIMARY KEY,
  campaign_id  INTEGER     NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id      INTEGER               REFERENCES users(id)    ON DELETE SET NULL,
  type         VARCHAR(10) NOT NULL  DEFAULT 'chat'
                           CHECK (type IN ('chat', 'roll', 'system')),
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL  DEFAULT NOW()
  -- In the messages CREATE TABLE, add these columns:
  avatar_url      VARCHAR(255),
  portrait        TEXT,
  character_name  VARCHAR(255),
);

-- ── Indexes ───────────────────────────────────────────────────
-- Speed up the most common queries:

-- "Which campaigns does this user belong to?" (dashboard load)
CREATE INDEX IF NOT EXISTS idx_campaign_members_user_id
  ON campaign_members(user_id);

-- "Who are the members of this campaign?" (room load)
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id
  ON campaign_members(campaign_id);

-- "Give me the last 50 messages for this campaign" (chat history)
-- DESC because we almost always want newest-first
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id_created
  ON messages(campaign_id, created_at DESC);

-- "Give me all messages from this user" (future: user history)
CREATE INDEX IF NOT EXISTS idx_messages_user_id
  ON messages(user_id);

-- ── Auto-update updated_at on campaigns ───────────────────────
-- PostgreSQL doesn't auto-update timestamps like MySQL does.
-- We need a trigger function + trigger for the campaigns table.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS ∑LaTeX Math is a Pro FeatureUnlock Telescopo Pro to render mathematical expressions and equations.Unlock Telescopo Pro LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

  -- ── v1.5.1 additions ─────────────────────────────────────────

-- Profile picture URL stored as a file path
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT NULL;

-- Which investigator a player registered for a campaign
ALTER TABLE campaign_members
  ADD COLUMN IF NOT EXISTS character_id INTEGER DEFAULT NULL
  REFERENCES characters(id) ON DELETE SET NULL;


  -- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(20) NOT NULL DEFAULT 'message'
               CHECK (type IN ('message', 'roll', 'invite')),
  campaign_id  INTEGER     REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_name VARCHAR(100),
  sender_name  VARCHAR(100),
  avatar_url   VARCHAR(255),
  content      TEXT        NOT NULL,
  is_read      BOOLEAN     NOT NULL DEFAULT false,
  -- Invites are pinned — not cleared by bulk clear
  is_pinned    BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id, created_at DESC);
