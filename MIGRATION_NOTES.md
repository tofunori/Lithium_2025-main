# Supabase to Neon Migration Notes

## Current Status
- **Branch**: `feature/migrate-to-neon`
- **Created**: 2025-06-16
- **Purpose**: Migrate from Supabase to Neon PostgreSQL to avoid 7-day database pausing

## Current Supabase Configuration
- **URL**: https://coskkeqncufimswnraub.supabase.co
- **Location**: `frontend/src/supabaseClient.ts` (hardcoded)
- **Features Used**:
  - Database (PostgreSQL)
  - Authentication
  - Real-time subscriptions
  - File storage

## Migration Plan

### Phase 1: Database Migration ✅
- [x] Create migration branch
- [ ] Set up Neon account
- [ ] Export Supabase schema/data
- [ ] Import to Neon
- [ ] Test connection

### Phase 2: Code Migration
- [ ] Replace `@supabase/supabase-js` with `pg`
- [ ] Update `supabaseClient.ts` → `databaseClient.ts`
- [ ] Refactor `supabaseDataService.ts`
- [ ] Update environment variables

### Phase 3: Authentication
- [ ] Choose auth strategy (remove/replace/custom)
- [ ] Update auth-related components
- [ ] Test user flows

### Phase 4: Storage
- [ ] Choose storage solution (Cloudinary/Vercel Blob/etc.)
- [ ] Update file upload components
- [ ] Migrate existing files

### Phase 5: Testing & Deployment
- [ ] Local testing
- [ ] Production environment setup
- [ ] Deploy and verify

## Files to Modify
- `frontend/src/supabaseClient.ts` → Replace with database client
- `frontend/src/supabaseDataService.ts` → Refactor for direct SQL
- `frontend/package.json` → Update dependencies
- `.env` files → Update connection strings
- Authentication components
- File upload components

## Rollback Plan
- Switch back to `main` branch
- Original Supabase setup remains intact
- No risk to production environment