-- V6: Add performance indexes for multi-tenant queries
-- This migration adds composite indexes to optimize tenant-scoped queries

-- Index for finding cylinders by company (via address join)
-- Optimizes: findByAddressCompanyId queries
CREATE INDEX IF NOT EXISTS idx_addresses_company_id_id ON addresses(company_id, id);

-- Index for finding active addresses by company
-- Optimizes: findByCompanyIdAndActive queries
CREATE INDEX IF NOT EXISTS idx_addresses_company_active ON addresses(company_id, active);

-- Index for finding active cylinders by address
-- Optimizes: filtered queries on cylinders
CREATE INDEX IF NOT EXISTS idx_cylinders_address_active ON cylinders(address_id, active);

-- Index for finding users by company
-- Optimizes: user listing within a company
CREATE INDEX IF NOT EXISTS idx_users_company_active ON users(company_id, active);
