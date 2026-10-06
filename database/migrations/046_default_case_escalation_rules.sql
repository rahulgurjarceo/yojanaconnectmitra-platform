-- Default YCM One case escalation policy.
-- Target teams are configurable; rules are inactive until explicitly enabled.
INSERT INTO ycm_case_escalation_rules
  (name, priority, trigger_type, threshold_value, escalate_to_team, escalate_after_minutes, active)
VALUES
  ('TAT breach', 100, 'tat_breach', 0, NULL, 0, false),
  ('CRI at risk', 90, 'cri_below', 60, NULL, 0, false),
  ('No case update', 80, 'no_update', 1440, NULL, 0, false),
  ('Rejected / rework', 70, 'rejection', 0, NULL, 0, false)
ON CONFLICT DO NOTHING;
