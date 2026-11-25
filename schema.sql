-- ============================================================
-- ServiceIQ: Full Schema
-- Run in Supabase SQL Editor in this exact order.
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- M1: IDENTITY AND TENANCY
-- ============================================================

CREATE TABLE person (
  person_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT UNIQUE,
  email         TEXT UNIQUE,
  base_city     TEXT,
  lang_pref     TEXT DEFAULT 'en',
  phone_verified  BOOLEAN DEFAULT FALSE,
  id_verified     BOOLEAN DEFAULT FALSE,
  joined_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organisation (
  org_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  org_type      TEXT NOT NULL DEFAULT 'service_centre'
                CHECK (org_type IN ('retailer','wholesaler','service_centre','brand','facility')),
  day_start     TIME DEFAULT '09:00',
  day_end       TIME DEFAULT '18:00',
  working_days  TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
  plan          TEXT DEFAULT 'starter',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_membership (
  membership_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organisation(org_id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner','dispatcher','technician','accounts')),
  engagement_type TEXT DEFAULT 'employee'
                  CHECK (engagement_type IN ('employee','contractor','marketplace')),
  emp_code        TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, org_id)
);

CREATE TABLE skill (
  skill_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT NOT NULL UNIQUE,
  requires_certification BOOLEAN DEFAULT FALSE
);

CREATE TABLE person_skill (
  person_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  skill_id        UUID NOT NULL REFERENCES skill(skill_id),
  level           TEXT CHECK (level IN ('trainee','competent','expert')),
  cert_number     TEXT,
  certified_from  DATE,
  certified_until DATE,
  verified_by_org UUID REFERENCES organisation(org_id),
  UNIQUE(person_id, skill_id)
);

CREATE TABLE holiday (
  holiday_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisation(org_id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  name         TEXT,
  UNIQUE(org_id, holiday_date)
);

-- ============================================================
-- M2: CUSTOMERS AND LOCATIONS
-- ============================================================

CREATE TABLE party (
  party_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organisation(org_id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  party_type TEXT NOT NULL CHECK (party_type IN ('customer','dealer','brand','vendor')),
  gstin      TEXT,
  phone      TEXT,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE site (
  site_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id      UUID NOT NULL REFERENCES party(party_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  address       TEXT,
  pincode       TEXT,
  contact_name  TEXT,
  contact_phone TEXT,
  geo_lat       FLOAT,
  geo_lng       FLOAT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- M3: EQUIPMENT CATALOGUE
-- ============================================================

CREATE TABLE equipment_category (
  category_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID REFERENCES organisation(org_id),
  parent_id        UUID REFERENCES equipment_category(category_id),
  name             TEXT NOT NULL,
  depth            INT DEFAULT 0,
  attribute_schema JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_model (
  model_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL REFERENCES organisation(org_id) ON DELETE CASCADE,
  category_id             UUID NOT NULL REFERENCES equipment_category(category_id),
  brand_name              TEXT,
  model_code              TEXT,
  name                    TEXT NOT NULL,
  spec                    JSONB DEFAULT '{}',
  default_warranty_months INT DEFAULT 12,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_unit (
  unit_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organisation(org_id),
  model_id         UUID REFERENCES product_model(model_id),
  site_id          UUID REFERENCES site(site_id),
  sold_to_party_id UUID REFERENCES party(party_id),
  serial_no        TEXT,
  sold_on          DATE,
  installed_on     DATE,
  warranty_end     DATE,
  status           TEXT DEFAULT 'installed'
                   CHECK (status IN ('in_stock','sold','installed','under_repair','scrapped')),
  attributes       JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- M4: AMC CONTRACTS
-- ============================================================

CREATE TABLE contract (
  contract_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organisation(org_id),
  party_id        UUID NOT NULL REFERENCES party(party_id),
  renewed_from_id UUID REFERENCES contract(contract_id),
  contract_no     TEXT NOT NULL,
  type            TEXT CHECK (type IN ('comprehensive','non_comprehensive','labour_only')),
  valid_from      DATE NOT NULL,
  valid_to        DATE NOT NULL,
  annual_value    NUMERIC(12,2),
  status          TEXT DEFAULT 'draft'
                  CHECK (status IN ('draft','active','expired','renewed','cancelled')),
  sla_targets     JSONB DEFAULT '{"P1_response_mins":60,"P2_response_mins":240,"P3_response_mins":480}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_equipment (
  contract_equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id           UUID NOT NULL REFERENCES contract(contract_id) ON DELETE CASCADE,
  unit_id               UUID NOT NULL REFERENCES equipment_unit(unit_id),
  pm_visits_per_year    INT DEFAULT 4,
  pm_frequency          TEXT DEFAULT 'quarterly'
                        CHECK (pm_frequency IN ('monthly','quarterly','half_yearly','yearly')),
  UNIQUE(contract_id, unit_id)
);

CREATE TABLE coverage_rule (
  rule_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contract(contract_id) ON DELETE CASCADE,
  scope       TEXT NOT NULL CHECK (scope IN ('part_category','fault_type','labour','travel','consumable')),
  match_value TEXT,
  is_covered  BOOLEAN DEFAULT TRUE,
  cap_amount  NUMERIC(10,2),
  priority    INT DEFAULT 0
);

CREATE TABLE pm_visit (
  pm_visit_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_equipment_id UUID NOT NULL REFERENCES contract_equipment(contract_equipment_id) ON DELETE CASCADE,
  due_date              DATE NOT NULL,
  grace_days            INT DEFAULT 15,
  status                TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','scheduled','done','skipped','breached'))
);

-- ============================================================
-- M5: CONFIGURABLE WORKFLOW
-- ============================================================

CREATE TABLE job_type (
  job_type_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organisation(org_id),
  code              TEXT NOT NULL,
  name              TEXT NOT NULL,
  checklist_schema  JSONB DEFAULT '[]',
  requires_signature BOOLEAN DEFAULT TRUE,
  requires_parts    BOOLEAN DEFAULT FALSE,
  UNIQUE(org_id, code)
);

CREATE TABLE workflow_state (
  state_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type_id     UUID NOT NULL REFERENCES job_type(job_type_id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  label           TEXT NOT NULL,
  allowed_next    TEXT[] DEFAULT '{}',
  is_initial      BOOLEAN DEFAULT FALSE,
  is_terminal     BOOLEAN DEFAULT FALSE,
  stops_sla_clock BOOLEAN DEFAULT FALSE,
  UNIQUE(job_type_id, code)
);

-- ============================================================
-- M6: WORK EXECUTION
-- ============================================================

CREATE SEQUENCE ticket_seq START 1000;
CREATE SEQUENCE job_seq START 1000;

CREATE TABLE ticket (
  ticket_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organisation(org_id),
  site_id           UUID REFERENCES site(site_id),
  unit_id           UUID REFERENCES equipment_unit(unit_id),
  ticket_no         TEXT NOT NULL DEFAULT 'TKT-' || LPAD(nextval('ticket_seq')::TEXT, 5, '0'),
  public_token      TEXT NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  source            TEXT DEFAULT 'portal'
                    CHECK (source IN ('phone','whatsapp','email','portal','walk_in')),
  fault_description TEXT,
  priority          TEXT DEFAULT 'P2' CHECK (priority IN ('P1','P2','P3')),
  reported_at       TIMESTAMPTZ DEFAULT NOW(),
  status            TEXT DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','awaiting_parts','closed')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job (
  job_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organisation(org_id),
  ticket_id        UUID REFERENCES ticket(ticket_id),
  pm_visit_id      UUID REFERENCES pm_visit(pm_visit_id),
  unit_id          UUID REFERENCES equipment_unit(unit_id),
  job_type_id      UUID REFERENCES job_type(job_type_id),
  current_state_id UUID REFERENCES workflow_state(state_id),
  job_no           TEXT NOT NULL DEFAULT 'JOB-' || LPAD(nextval('job_seq')::TEXT, 5, '0'),
  scheduled_start  TIMESTAMPTZ,
  scheduled_end    TIMESTAMPTZ,
  actual_start     TIMESTAMPTZ,
  actual_end       TIMESTAMPTZ,
  response_due     TIMESTAMPTZ,
  resolution_due   TIMESTAMPTZ,
  paused_minutes   INT DEFAULT 0,
  breached         BOOLEAN DEFAULT FALSE,
  customer_rating  INT CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,
  checklist_answers JSONB DEFAULT '{}',
  attachment_urls  TEXT[] DEFAULT '{}',
  signature_url    TEXT,
  technician_notes TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_assignment (
  assignment_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
  person_id         UUID NOT NULL REFERENCES person(person_id),
  required_skill_id UUID REFERENCES skill(skill_id),
  slot_start        TIMESTAMPTZ,
  slot_end          TIMESTAMPTZ,
  status            TEXT DEFAULT 'offered'
                    CHECK (status IN ('offered','accepted','declined','completed')),
  is_lead           BOOLEAN DEFAULT TRUE,
  payout_amount     NUMERIC(10,2),
  offered_at        TIMESTAMPTZ DEFAULT NOW(),
  responded_at      TIMESTAMPTZ
);

-- Cross-tenant double-booking prevention.
-- A technician cannot have two accepted assignments with overlapping slots,
-- even if they belong to different orgs.
ALTER TABLE job_assignment ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    person_id WITH =,
    tstzrange(slot_start, slot_end, '[)') WITH &&
  ) WHERE (status = 'accepted' AND slot_start IS NOT NULL AND slot_end IS NOT NULL);

CREATE TABLE job_status_event (
  event_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         UUID NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
  from_state_id  UUID REFERENCES workflow_state(state_id),
  to_state_id    UUID REFERENCES workflow_state(state_id),
  changed_by     UUID REFERENCES person(person_id),
  changed_at     TIMESTAMPTZ DEFAULT NOW(),
  geo_lat        FLOAT,
  geo_lng        FLOAT,
  synced_offline BOOLEAN DEFAULT FALSE
);

CREATE TABLE part (
  part_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organisation(org_id),
  part_no    TEXT,
  name       TEXT NOT NULL,
  uom        TEXT DEFAULT 'piece',
  sell_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_part (
  job_part_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id               UUID NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
  part_id              UUID REFERENCES part(part_id),
  contract_id          UUID REFERENCES contract(contract_id),
  rule_id              UUID REFERENCES coverage_rule(rule_id),
  quantity             NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price           NUMERIC(10,2),
  is_chargeable        BOOLEAN DEFAULT FALSE,
  coverage_source      TEXT CHECK (coverage_source IN ('amc','warranty','none')),
  coverage_explanation TEXT
);

-- ============================================================
-- M7: AUDIT
-- ============================================================

CREATE TABLE audit_log (
  audit_id   BIGSERIAL PRIMARY KEY,
  org_id     UUID REFERENCES organisation(org_id),
  table_name TEXT NOT NULL,
  row_id     UUID,
  action     TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_row    JSONB,
  new_row    JSONB,
  changed_by UUID REFERENCES person(person_id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Every major query starts with org_id
CREATE INDEX idx_ticket_org        ON ticket(org_id);
CREATE INDEX idx_job_org           ON job(org_id);
CREATE INDEX idx_party_org         ON party(org_id);
CREATE INDEX idx_contract_org      ON contract(org_id);
CREATE INDEX idx_equipment_unit_org ON equipment_unit(org_id);
CREATE INDEX idx_part_org          ON part(org_id);

-- Common lookup patterns
CREATE INDEX idx_ticket_status     ON ticket(org_id, status);
CREATE INDEX idx_job_state         ON job(org_id, current_state_id);
CREATE INDEX idx_contract_validity ON contract(org_id, valid_from, valid_to);
CREATE INDEX idx_contract_party    ON contract(party_id, status);
CREATE INDEX idx_pm_visit_due      ON pm_visit(due_date) WHERE status = 'pending';
CREATE INDEX idx_assignment_person ON job_assignment(person_id, status);

-- JSONB attributes
CREATE INDEX idx_equipment_attributes ON equipment_unit USING gin(attributes);

-- Full text search on ticket description
CREATE INDEX idx_ticket_fts ON ticket
  USING gin(to_tsvector('english', COALESCE(fault_description, '')));

-- Audit log: BRIN is optimal for append-only timestamp-ordered tables
CREATE INDEX idx_audit_brin  ON audit_log USING brin(changed_at);
CREATE INDEX idx_audit_table ON audit_log(table_name, row_id);

-- ============================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================

CREATE OR REPLACE FUNCTION fn_my_person_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT person_id FROM person WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_my_org_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT org_id FROM org_membership
  WHERE person_id = fn_my_person_id() AND is_active = TRUE;
$$;

CREATE OR REPLACE FUNCTION fn_my_role(p_org_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM org_membership
  WHERE person_id = fn_my_person_id()
    AND org_id = p_org_id
    AND is_active = TRUE
  LIMIT 1;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organisation    ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_membership  ENABLE ROW LEVEL SECURITY;
ALTER TABLE person          ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_skill    ENABLE ROW LEVEL SECURITY;
ALTER TABLE party           ENABLE ROW LEVEL SECURITY;
ALTER TABLE site            ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_unit  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_rule   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_visit        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket          ENABLE ROW LEVEL SECURITY;
ALTER TABLE job             ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignment  ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_part        ENABLE ROW LEVEL SECURITY;
ALTER TABLE part            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;

-- Org-scoped tables: member of the org can read/write
-- Members can read their org. Only owners can edit it. Nobody creates or deletes
-- orgs from the client: creation goes through fn_create_org(), see PATCH 01 below.
CREATE POLICY "org_read" ON organisation
  FOR SELECT USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_owner_update" ON organisation
  FOR UPDATE USING (fn_my_role(org_id) = 'owner');

CREATE POLICY "org_access" ON party
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON site
  FOR ALL USING (party_id IN (
    SELECT party_id FROM party WHERE org_id IN (SELECT fn_my_org_ids())
  ));

CREATE POLICY "org_access" ON equipment_unit
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON contract
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON contract_equipment
  FOR ALL USING (contract_id IN (
    SELECT contract_id FROM contract WHERE org_id IN (SELECT fn_my_org_ids())
  ));

CREATE POLICY "org_access" ON coverage_rule
  FOR ALL USING (contract_id IN (
    SELECT contract_id FROM contract WHERE org_id IN (SELECT fn_my_org_ids())
  ));

CREATE POLICY "org_access" ON pm_visit
  FOR ALL USING (contract_equipment_id IN (
    SELECT ce.contract_equipment_id
    FROM contract_equipment ce
    JOIN contract c ON c.contract_id = ce.contract_id
    WHERE c.org_id IN (SELECT fn_my_org_ids())
  ));

CREATE POLICY "org_access" ON ticket
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON job
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON part
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON audit_log
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

-- Assignments: org members see all, technician sees only their own
CREATE POLICY "assignment_read" ON job_assignment FOR SELECT
  USING (
    person_id = fn_my_person_id()
    OR job_id IN (SELECT job_id FROM job WHERE org_id IN (SELECT fn_my_org_ids()))
  );

CREATE POLICY "assignment_write" ON job_assignment FOR INSERT
  WITH CHECK (job_id IN (SELECT job_id FROM job WHERE org_id IN (SELECT fn_my_org_ids())));

CREATE POLICY "assignment_update" ON job_assignment FOR UPDATE
  USING (
    job_id IN (SELECT job_id FROM job WHERE org_id IN (SELECT fn_my_org_ids()))
    OR person_id = fn_my_person_id()
  );

-- Person: see own profile + members of shared orgs
CREATE POLICY "person_read" ON person FOR SELECT
  USING (
    person_id = fn_my_person_id()
    OR person_id IN (
      SELECT person_id FROM org_membership
      WHERE org_id IN (SELECT fn_my_org_ids()) AND is_active = TRUE
    )
  );

CREATE POLICY "person_update" ON person FOR UPDATE
  USING (person_id = fn_my_person_id());

CREATE POLICY "person_insert" ON person FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "membership_read" ON org_membership FOR SELECT
  USING (
    person_id = fn_my_person_id()
    OR org_id IN (SELECT fn_my_org_ids())
  );

CREATE POLICY "person_skill_access" ON person_skill FOR ALL
  USING (
    person_id = fn_my_person_id()
    OR person_id IN (
      SELECT person_id FROM org_membership
      WHERE org_id IN (SELECT fn_my_org_ids()) AND is_active = TRUE
    )
  );

CREATE POLICY "job_status_event_access" ON job_status_event FOR ALL
  USING (job_id IN (SELECT job_id FROM job WHERE org_id IN (SELECT fn_my_org_ids())));

CREATE POLICY "job_part_access" ON job_part FOR ALL
  USING (job_id IN (SELECT job_id FROM job WHERE org_id IN (SELECT fn_my_org_ids())));

-- ============================================================
-- AUDIT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id   UUID;
  v_row_id   UUID;
  v_old_row  JSONB;
  v_new_row  JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old_row := row_to_json(OLD)::JSONB;
    v_new_row := NULL;
    v_org_id  := (v_old_row->>'org_id')::UUID;
    v_row_id  := (v_old_row->>TG_ARGV[0])::UUID;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_row := NULL;
    v_new_row := row_to_json(NEW)::JSONB;
    v_org_id  := (v_new_row->>'org_id')::UUID;
    v_row_id  := (v_new_row->>TG_ARGV[0])::UUID;
  ELSE
    v_old_row := row_to_json(OLD)::JSONB;
    v_new_row := row_to_json(NEW)::JSONB;
    v_org_id  := (v_new_row->>'org_id')::UUID;
    v_row_id  := (v_new_row->>TG_ARGV[0])::UUID;
  END IF;

  INSERT INTO audit_log(org_id, table_name, row_id, action, old_row, new_row, changed_by)
  VALUES (v_org_id, TG_TABLE_NAME, v_row_id, TG_OP, v_old_row, v_new_row, fn_my_person_id());

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_contract
  AFTER INSERT OR UPDATE OR DELETE ON contract
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('contract_id');

CREATE TRIGGER audit_job
  AFTER INSERT OR UPDATE OR DELETE ON job
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('job_id');

CREATE TRIGGER audit_job_assignment
  AFTER INSERT OR UPDATE OR DELETE ON job_assignment
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('assignment_id');

-- ============================================================
-- PM VISIT GENERATION
-- ============================================================

CREATE OR REPLACE FUNCTION fn_generate_pm_visits(p_contract_id UUID)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
  ce         RECORD;
  c          RECORD;
  v_interval INTERVAL;
  v_due      DATE;
  v_count    INT := 0;
BEGIN
  SELECT * INTO c FROM contract WHERE contract_id = p_contract_id;

  FOR ce IN SELECT * FROM contract_equipment WHERE contract_id = p_contract_id LOOP
    v_interval := CASE ce.pm_frequency
      WHEN 'monthly'     THEN INTERVAL '1 month'
      WHEN 'quarterly'   THEN INTERVAL '3 months'
      WHEN 'half_yearly' THEN INTERVAL '6 months'
      WHEN 'yearly'      THEN INTERVAL '1 year'
      ELSE INTERVAL '3 months'
    END;

    v_due := c.valid_from + v_interval;

    WHILE v_due <= c.valid_to LOOP
      INSERT INTO pm_visit(contract_equipment_id, due_date, grace_days, status)
      VALUES (ce.contract_equipment_id, v_due, 15, 'pending')
      ON CONFLICT DO NOTHING;
      v_due   := v_due + v_interval;
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION fn_on_contract_activate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status <> 'active') THEN
    PERFORM fn_generate_pm_visits(NEW.contract_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contract_activate
  AFTER INSERT OR UPDATE ON contract
  FOR EACH ROW EXECUTE FUNCTION fn_on_contract_activate();

-- ============================================================
-- ENTITLEMENT CHECK FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_entitlement(
  p_unit_id       UUID,
  p_part_category TEXT DEFAULT NULL,
  p_scope         TEXT DEFAULT 'part_category'
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_unit   RECORD;
  v_rule   RECORD;
BEGIN
  SELECT * INTO v_unit FROM equipment_unit WHERE unit_id = p_unit_id;

  -- 1. Warranty check
  IF v_unit.warranty_end IS NOT NULL AND v_unit.warranty_end >= CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'covered', TRUE,
      'source', 'warranty',
      'explanation', 'Under manufacturer warranty until ' || v_unit.warranty_end
    );
  END IF;

  -- 2. AMC coverage check
  SELECT cr.rule_id, cr.is_covered, cr.cap_amount, c.contract_id, c.contract_no
  INTO v_rule
  FROM contract c
  JOIN contract_equipment ce ON ce.contract_id = c.contract_id
  JOIN coverage_rule cr ON cr.contract_id = c.contract_id
  WHERE ce.unit_id = p_unit_id
    AND c.status = 'active'
    AND CURRENT_DATE BETWEEN c.valid_from AND c.valid_to
    AND cr.scope = p_scope
    AND (cr.match_value = p_part_category OR cr.match_value IS NULL)
    AND cr.is_covered = TRUE
  ORDER BY cr.priority DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'covered', TRUE,
      'source', 'amc',
      'contract_id', v_rule.contract_id,
      'rule_id', v_rule.rule_id,
      'explanation', 'Covered under AMC ' || v_rule.contract_no
    );
  END IF;

  RETURN jsonb_build_object(
    'covered', FALSE,
    'source', 'none',
    'explanation', 'No active warranty or AMC coverage found'
  );
END;
$$;

-- ============================================================
-- MATERIALIZED VIEWS
-- ============================================================

-- Technician performance (refresh nightly via Edge Function)
CREATE MATERIALIZED VIEW mv_technician_performance AS
SELECT
  p.person_id,
  p.full_name,
  COUNT(DISTINCT ja.job_id)                                          AS jobs_assigned,
  COUNT(DISTINCT CASE WHEN ws.is_terminal THEN ja.job_id END)       AS jobs_completed,
  ROUND(AVG(j.customer_rating) FILTER (WHERE j.customer_rating IS NOT NULL), 2) AS avg_rating,
  COUNT(DISTINCT CASE WHEN j.breached THEN ja.job_id END)           AS sla_breaches,
  ROUND(
    COUNT(DISTINCT CASE WHEN ws.is_terminal THEN ja.job_id END)::NUMERIC
    / NULLIF(COUNT(DISTINCT ja.job_id), 0) * 100, 1
  )                                                                  AS completion_rate_pct
FROM person p
LEFT JOIN job_assignment ja ON ja.person_id = p.person_id AND ja.status = 'completed'
LEFT JOIN job j             ON j.job_id = ja.job_id
LEFT JOIN workflow_state ws ON ws.state_id = j.current_state_id
GROUP BY p.person_id, p.full_name;

CREATE UNIQUE INDEX ON mv_technician_performance(person_id);

-- Renewal pipeline (refresh nightly)
CREATE MATERIALIZED VIEW mv_renewal_pipeline AS
SELECT
  c.org_id,
  c.contract_id,
  c.contract_no,
  c.valid_to,
  c.annual_value,
  c.status,
  p.name       AS customer_name,
  p.phone      AS customer_phone,
  (c.valid_to - CURRENT_DATE) AS days_until_expiry,
  COUNT(ce.contract_equipment_id) AS equipment_count
FROM contract c
JOIN party p ON p.party_id = c.party_id
LEFT JOIN contract_equipment ce ON ce.contract_id = c.contract_id
WHERE c.status = 'active'
  AND c.valid_to >= CURRENT_DATE
GROUP BY c.org_id, c.contract_id, c.contract_no, c.valid_to,
         c.annual_value, c.status, p.name, p.phone;

CREATE INDEX ON mv_renewal_pipeline(org_id, days_until_expiry);
CREATE UNIQUE INDEX ON mv_renewal_pipeline(contract_id);  -- required for REFRESH ... CONCURRENTLY

-- ============================================================
-- SEED: DEFAULT SKILLS
-- ============================================================

INSERT INTO skill(name, requires_certification) VALUES
  ('HVAC / Air Conditioning', FALSE),
  ('Lift / Elevator',         TRUE),
  ('Fire Safety',             TRUE),
  ('Diesel Generator',        FALSE),
  ('Water Treatment',         FALSE),
  ('Commercial Kitchen',      FALSE),
  ('General Appliances',      FALSE),
  ('CCTV / Security',         FALSE),
  ('Electrical',              TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED: DEFAULT EQUIPMENT CATEGORIES
-- ============================================================

INSERT INTO equipment_category(name, depth, attribute_schema) VALUES
  ('HVAC', 0, '[{"key":"tonnage","label":"Tonnage","type":"number"},{"key":"star_rating","label":"Star Rating","type":"number"}]'),
  ('Lifts & Elevators', 0, '[{"key":"capacity_kg","label":"Capacity (kg)","type":"number"},{"key":"floors","label":"No. of Floors","type":"number"}]'),
  ('Fire Safety', 0, '[{"key":"type","label":"Type","type":"enum","options":["Suppression","Detection","Extinguisher"]}]'),
  ('Diesel Generator', 0, '[{"key":"kva","label":"KVA","type":"number"},{"key":"fuel_capacity_l","label":"Fuel Tank (L)","type":"number"}]'),
  ('General Appliances', 0, '[]')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FUNCTION: Seed default job types for a new org
-- Call this after creating an org: SELECT fn_seed_org(org_id);
-- ============================================================

CREATE OR REPLACE FUNCTION fn_seed_org(p_org_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_bd  UUID;
  v_pm  UUID;
  v_ins UUID;
BEGIN
  INSERT INTO job_type(org_id, code, name, requires_signature, requires_parts)
    VALUES (p_org_id, 'breakdown', 'Breakdown Repair', TRUE, TRUE)
    RETURNING job_type_id INTO v_bd;

  INSERT INTO workflow_state(job_type_id, code, label, allowed_next, is_initial, is_terminal, stops_sla_clock)
  VALUES
    (v_bd, 'open',           'Open',             ARRAY['assigned'],               TRUE,  FALSE, FALSE),
    (v_bd, 'assigned',       'Assigned',         ARRAY['en_route','cancelled'],   FALSE, FALSE, FALSE),
    (v_bd, 'en_route',       'En Route',         ARRAY['on_site'],                FALSE, FALSE, FALSE),
    (v_bd, 'on_site',        'On Site',          ARRAY['awaiting_parts','closed'],FALSE, FALSE, FALSE),
    (v_bd, 'awaiting_parts', 'Awaiting Parts',   ARRAY['on_site'],                FALSE, FALSE, TRUE),
    (v_bd, 'closed',         'Closed',           ARRAY[]::TEXT[],                 FALSE, TRUE,  TRUE),
    (v_bd, 'cancelled',      'Cancelled',        ARRAY[]::TEXT[],                 FALSE, TRUE,  TRUE);

  INSERT INTO job_type(org_id, code, name, requires_signature, requires_parts)
    VALUES (p_org_id, 'pm', 'Preventive Maintenance', TRUE, FALSE)
    RETURNING job_type_id INTO v_pm;

  INSERT INTO workflow_state(job_type_id, code, label, allowed_next, is_initial, is_terminal, stops_sla_clock)
  VALUES
    (v_pm, 'scheduled', 'Scheduled', ARRAY['en_route','skipped'], TRUE,  FALSE, FALSE),
    (v_pm, 'en_route',  'En Route',  ARRAY['on_site'],            FALSE, FALSE, FALSE),
    (v_pm, 'on_site',   'On Site',   ARRAY['closed'],             FALSE, FALSE, FALSE),
    (v_pm, 'closed',    'Completed', ARRAY[]::TEXT[],             FALSE, TRUE,  TRUE),
    (v_pm, 'skipped',   'Skipped',   ARRAY[]::TEXT[],             FALSE, TRUE,  TRUE);

  INSERT INTO job_type(org_id, code, name, requires_signature, requires_parts)
    VALUES (p_org_id, 'installation', 'Installation', TRUE, TRUE)
    RETURNING job_type_id INTO v_ins;

  INSERT INTO workflow_state(job_type_id, code, label, allowed_next, is_initial, is_terminal, stops_sla_clock)
  VALUES
    (v_ins, 'scheduled', 'Scheduled', ARRAY['en_route'],  TRUE,  FALSE, FALSE),
    (v_ins, 'en_route',  'En Route',  ARRAY['on_site'],   FALSE, FALSE, FALSE),
    (v_ins, 'on_site',   'On Site',   ARRAY['closed'],    FALSE, FALSE, FALSE),
    (v_ins, 'closed',    'Installed', ARRAY[]::TEXT[],    FALSE, TRUE,  TRUE);
END;
$$;


-- ============================================================
-- PATCH 01: fixes found in review before first run
-- ============================================================

-- PM visits: fn_generate_pm_visits uses ON CONFLICT DO NOTHING, which needs a unique target
CREATE UNIQUE INDEX uq_pm_visit ON pm_visit(contract_equipment_id, due_date);

-- Tables that had no RLS at all (the anon key could read AND write them)
ALTER TABLE skill              ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday            ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_model      ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_type           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_state     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skill_read" ON skill FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "org_access" ON holiday
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

-- Global categories (org_id NULL) are readable by everyone, writable by nobody on the client.
CREATE POLICY "category_read" ON equipment_category
  FOR SELECT USING (org_id IS NULL OR org_id IN (SELECT fn_my_org_ids()));
CREATE POLICY "category_write" ON equipment_category
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()))
  WITH CHECK (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON product_model
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON job_type
  FOR ALL USING (org_id IN (SELECT fn_my_org_ids()));

CREATE POLICY "org_access" ON workflow_state
  FOR ALL USING (job_type_id IN (
    SELECT job_type_id FROM job_type WHERE org_id IN (SELECT fn_my_org_ids())
  ));

-- Owners can change roles / deactivate members
CREATE POLICY "membership_owner_update" ON org_membership
  FOR UPDATE USING (fn_my_role(org_id) = 'owner');

-- ------------------------------------------------------------
-- Onboarding. A brand new user belongs to no org, so no RLS policy can let them
-- create the first one. This function does it atomically, as the table owner.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_create_org(
  p_full_name TEXT,
  p_phone     TEXT,
  p_org_name  TEXT,
  p_org_type  TEXT DEFAULT 'service_centre'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid    UUID := auth.uid();
  v_email  TEXT;
  v_person UUID;
  v_org    UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  SELECT person_id INTO v_person FROM person WHERE auth_user_id = v_uid;

  IF v_person IS NULL THEN
    INSERT INTO person(auth_user_id, full_name, phone, email)
    VALUES (v_uid, p_full_name, p_phone, v_email)
    RETURNING person_id INTO v_person;
  END IF;

  INSERT INTO organisation(name, org_type) VALUES (p_org_name, p_org_type)
  RETURNING org_id INTO v_org;

  INSERT INTO org_membership(person_id, org_id, role) VALUES (v_person, v_org, 'owner');

  PERFORM fn_seed_org(v_org);
  RETURN v_org;
END;
$$;

-- ------------------------------------------------------------
-- Materialised views ignore RLS. Lock the raw views down and expose filtered wrappers.
-- App code reads v_*; only the service role / cron touch mv_*.
-- ------------------------------------------------------------
REVOKE ALL ON mv_technician_performance, mv_renewal_pipeline FROM PUBLIC, anon, authenticated;

CREATE VIEW v_renewal_pipeline AS
  SELECT * FROM mv_renewal_pipeline
  WHERE org_id IN (SELECT fn_my_org_ids());

CREATE VIEW v_technician_performance AS
  SELECT * FROM mv_technician_performance
  WHERE person_id IN (
    SELECT person_id FROM org_membership
    WHERE org_id IN (SELECT fn_my_org_ids()) AND is_active = TRUE
  );

REVOKE ALL ON v_renewal_pipeline, v_technician_performance FROM PUBLIC, anon;
GRANT SELECT ON v_renewal_pipeline, v_technician_performance TO authenticated;

-- ------------------------------------------------------------
-- Nightly housekeeping in pure SQL (replaces the Edge Function that used an
-- unsupported subquery filter). Schedule with pg_cron, see Track E.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_daily_checks()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE pm_visit SET status = 'breached'
  WHERE status = 'pending' AND due_date + grace_days < CURRENT_DATE;

  UPDATE job j SET breached = TRUE
  WHERE j.breached = FALSE
    AND j.resolution_due IS NOT NULL
    AND j.resolution_due < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM workflow_state ws
      WHERE ws.state_id = j.current_state_id AND ws.is_terminal
    );

  UPDATE contract SET status = 'expired'
  WHERE status = 'active' AND valid_to < CURRENT_DATE;

  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_technician_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_renewal_pipeline;
END;
$$;
REVOKE ALL ON FUNCTION fn_daily_checks() FROM PUBLIC, anon, authenticated;

-- Used by Track D photo upload
CREATE OR REPLACE FUNCTION fn_append_attachment(p_job_id UUID, p_url TEXT)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE job SET attachment_urls = array_append(attachment_urls, p_url)
  WHERE job_id = p_job_id;
$$;

-- After enabling the pg_cron extension (Database > Extensions), run once:
-- SELECT cron.schedule('serviceiq-daily', '30 17 * * *', 'SELECT fn_daily_checks()');  -- 23:00 IST
