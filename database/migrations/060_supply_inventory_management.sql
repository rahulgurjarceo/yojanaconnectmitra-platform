-- 060: multi-location supply and inventory management
CREATE TABLE IF NOT EXISTS ycm_supply_locations (
 location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), location_code VARCHAR(80) NOT NULL UNIQUE,
 location_name VARCHAR(180) NOT NULL, location_type VARCHAR(24) NOT NULL DEFAULT 'store' CHECK(location_type IN ('warehouse','store','centre','franchise','office')),
 address TEXT, status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ycm_supply_items (
 item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sku VARCHAR(100) NOT NULL UNIQUE, item_name VARCHAR(180) NOT NULL,
 category VARCHAR(80) NOT NULL DEFAULT 'general', unit VARCHAR(24) NOT NULL DEFAULT 'unit', reorder_level INTEGER NOT NULL DEFAULT 0 CHECK(reorder_level>=0),
 status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ycm_supply_stock (
 location_id UUID NOT NULL REFERENCES ycm_supply_locations(location_id), item_id UUID NOT NULL REFERENCES ycm_supply_items(item_id),
 quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity>=0), average_unit_cost_paise BIGINT NOT NULL DEFAULT 0 CHECK(average_unit_cost_paise>=0),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(location_id,item_id)
);
CREATE TABLE IF NOT EXISTS ycm_supply_transfers (
 transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), transfer_reference VARCHAR(100) NOT NULL UNIQUE,
 source_location_id UUID NOT NULL REFERENCES ycm_supply_locations(location_id), destination_location_id UUID NOT NULL REFERENCES ycm_supply_locations(location_id),
 status VARCHAR(16) NOT NULL DEFAULT 'in_transit' CHECK(status IN ('in_transit','received','cancelled')), notes TEXT, created_by UUID, received_by UUID,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), received_at TIMESTAMPTZ, CHECK(source_location_id<>destination_location_id)
);
CREATE TABLE IF NOT EXISTS ycm_supply_transfer_lines (
 transfer_id UUID NOT NULL REFERENCES ycm_supply_transfers(transfer_id) ON DELETE CASCADE, item_id UUID NOT NULL REFERENCES ycm_supply_items(item_id),
 quantity INTEGER NOT NULL CHECK(quantity>0), unit_cost_paise BIGINT NOT NULL DEFAULT 0 CHECK(unit_cost_paise>=0), PRIMARY KEY(transfer_id,item_id)
);
CREATE TABLE IF NOT EXISTS ycm_supply_movements (
 movement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), location_id UUID NOT NULL REFERENCES ycm_supply_locations(location_id),
 item_id UUID NOT NULL REFERENCES ycm_supply_items(item_id), movement_type VARCHAR(24) NOT NULL CHECK(movement_type IN ('opening','purchase_receipt','transfer_out','transfer_in','adjustment')),
 quantity_delta INTEGER NOT NULL CHECK(quantity_delta<>0), unit_cost_paise BIGINT NOT NULL DEFAULT 0 CHECK(unit_cost_paise>=0),
 vendor_name VARCHAR(180), invoice_reference VARCHAR(180), transfer_id UUID REFERENCES ycm_supply_transfers(transfer_id), external_reference VARCHAR(180) UNIQUE,
 notes TEXT, created_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ycm_supply_stock_item_idx ON ycm_supply_stock(item_id,location_id);
CREATE INDEX IF NOT EXISTS ycm_supply_movements_location_idx ON ycm_supply_movements(location_id,created_at DESC);
CREATE INDEX IF NOT EXISTS ycm_supply_movements_item_idx ON ycm_supply_movements(item_id,created_at DESC);
CREATE INDEX IF NOT EXISTS ycm_supply_transfers_status_idx ON ycm_supply_transfers(status,created_at DESC);
