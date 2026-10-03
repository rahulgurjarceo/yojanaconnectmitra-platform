-- 032: company financial control, expenses, assets, budgets and management reporting
CREATE TABLE IF NOT EXISTS ycm_company_expenses (
  expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(32) NOT NULL CHECK (category IN ('employee','office','marketing','operations','technology','travel','legal_compliance','asset_purchase','bank_payment','other')),
  subcategory VARCHAR(80),
  vendor_name VARCHAR(180),
  description TEXT NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  payment_method VARCHAR(24),
  reference VARCHAR(180),
  employee_user_id UUID REFERENCES ycm_users(id),
  asset_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'posted' CHECK (status IN ('draft','posted','approved','cancelled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ycm_company_expenses_date_idx ON ycm_company_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS ycm_company_expenses_category_idx ON ycm_company_expenses(category,expense_date DESC);
CREATE INDEX IF NOT EXISTS ycm_company_expenses_employee_idx ON ycm_company_expenses(employee_user_id,expense_date DESC);

CREATE TABLE IF NOT EXISTS ycm_company_assets (
  asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date DATE NOT NULL,
  asset_code VARCHAR(80) UNIQUE,
  asset_category VARCHAR(48) NOT NULL,
  asset_name VARCHAR(180) NOT NULL,
  description TEXT,
  vendor_name VARCHAR(180),
  invoice_reference VARCHAR(180),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  purchase_amount_paise BIGINT NOT NULL CHECK (purchase_amount_paise >= 0),
  current_value_paise BIGINT NOT NULL DEFAULT 0 CHECK (current_value_paise >= 0),
  assigned_employee_user_id UUID REFERENCES ycm_users(id),
  location VARCHAR(180),
  status VARCHAR(24) NOT NULL DEFAULT 'active' CHECK (status IN ('active','assigned','maintenance','disposed','lost')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ycm_company_assets_purchase_idx ON ycm_company_assets(purchase_date DESC);
CREATE INDEX IF NOT EXISTS ycm_company_assets_employee_idx ON ycm_company_assets(assigned_employee_user_id);

ALTER TABLE ycm_company_expenses ADD CONSTRAINT ycm_company_expenses_asset_fk FOREIGN KEY (asset_id) REFERENCES ycm_company_assets(asset_id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS ycm_company_budgets (
  budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  category VARCHAR(32) NOT NULL,
  budget_amount_paise BIGINT NOT NULL CHECK (budget_amount_paise >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','closed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(period_start,period_end,category)
);

CREATE TABLE IF NOT EXISTS ycm_company_revenue (
  revenue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue_type VARCHAR(48) NOT NULL,
  service_code VARCHAR(120),
  customer_reference VARCHAR(180),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  external_reference VARCHAR(180) UNIQUE,
  financial_transaction_id UUID REFERENCES ycm_financial_transactions(transaction_id),
  status VARCHAR(16) NOT NULL DEFAULT 'posted' CHECK (status IN ('draft','posted','reversed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ycm_company_revenue_date_idx ON ycm_company_revenue(revenue_date DESC);
CREATE INDEX IF NOT EXISTS ycm_company_revenue_type_idx ON ycm_company_revenue(revenue_type,revenue_date DESC);

CREATE OR REPLACE VIEW ycm_company_financial_monthly AS
WITH months AS (
  SELECT date_trunc('month', d)::date AS month_start
  FROM generate_series(
    date_trunc('month', CURRENT_DATE) - INTERVAL '23 months',
    date_trunc('month', CURRENT_DATE), INTERVAL '1 month'
  ) d
), expense AS (
  SELECT date_trunc('month',expense_date)::date month_start, category, SUM(amount_paise) amount_paise
  FROM ycm_company_expenses WHERE status IN ('posted','approved') GROUP BY 1,2
), revenue AS (
  SELECT date_trunc('month',revenue_date)::date month_start, SUM(amount_paise) amount_paise
  FROM ycm_company_revenue WHERE status='posted' GROUP BY 1
), ledger_revenue AS (
  SELECT date_trunc('month',created_at)::date month_start, SUM(gross_amount_paise) amount_paise
  FROM ycm_financial_transactions WHERE state IN ('success','reconciled') GROUP BY 1
)
SELECT m.month_start,
  COALESCE(r.amount_paise,0) + COALESCE(l.amount_paise,0) AS revenue_paise,
  COALESCE(SUM(CASE WHEN e.category='employee' THEN e.amount_paise ELSE 0 END),0) employee_expense_paise,
  COALESCE(SUM(CASE WHEN e.category='office' THEN e.amount_paise ELSE 0 END),0) office_expense_paise,
  COALESCE(SUM(CASE WHEN e.category='marketing' THEN e.amount_paise ELSE 0 END),0) marketing_expense_paise,
  COALESCE(SUM(CASE WHEN e.category='operations' THEN e.amount_paise ELSE 0 END),0) operations_expense_paise,
  COALESCE(SUM(e.amount_paise),0) total_expense_paise
FROM months m LEFT JOIN expense e ON e.month_start=m.month_start LEFT JOIN revenue r ON r.month_start=m.month_start LEFT JOIN ledger_revenue l ON l.month_start=m.month_start
GROUP BY m.month_start,r.amount_paise,l.amount_paise;
