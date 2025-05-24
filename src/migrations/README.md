# Database Migrations

## Option 1: Using Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project dashboard (https://app.supabase.com)
2. Navigate to the "SQL Editor" section in the left sidebar
3. Create a "New Query"
4. Copy and paste the contents of `001_create_responders_table.sql`
5. Click "Run" to execute the migration

## Option 2: Using Supabase CLI

1. Install Supabase CLI if you haven't already:
   ```bash
   # Using Homebrew (macOS)
   brew install supabase/tap/supabase

   # Using npm
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in the Supabase dashboard URL or project settings)

4. Run the migration:
   ```bash
   supabase db push
   ```

## Verifying the Migration

After running the migration, you can verify the changes by:

1. Going to the Supabase Dashboard
2. Navigate to "Table Editor"
3. You should see:
   - New `responders` table
   - Updated `medical_reports` table with `responder_id` column
   - New `assignment_audit` table

## Adding Test Data

To add some test responders, run this SQL in the Supabase SQL Editor:

```sql
-- Insert some test responders
INSERT INTO responders (name, email) VALUES
  ('Dr. Jane Smith', 'jane.smith@healthcare.org'),
  ('Dr. John Doe', 'john.doe@healthcare.org'),
  ('Nurse Sarah Wilson', 'sarah.wilson@healthcare.org'),
  ('Dr. Michael Brown', 'michael.brown@healthcare.org');

-- Verify the insert
SELECT * FROM responders;
```

## Troubleshooting

If you encounter any errors:

1. Check if the tables already exist:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('responders', 'medical_reports', 'assignment_audit');
   ```

2. If tables exist but need to be recreated:
   ```sql
   -- Drop tables in correct order (if needed)
   DROP TABLE IF EXISTS assignment_audit;
   DROP TABLE IF EXISTS medical_reports;
   DROP TABLE IF EXISTS responders;
   ```
   Then run the migration again.

3. For permission issues, ensure your database role has the necessary privileges:
   ```sql
   GRANT ALL ON ALL TABLES IN SCHEMA public TO your_role;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_role;
   ``` 