# Course subsections (Section → Subsection → Lesson)

The schema now uses **subsections** between **sections** and **lessons**.

## New database (empty)

```bash
npx prisma db push
```

## Existing database with `lessons.sectionId`

You must move lessons under a subsection before dropping `sectionId`.

1. Backup your database.
2. Apply schema with Prisma **after** running data SQL, or use the steps below.

Example **PostgreSQL** (adjust IDs if you use cuids from app):

```sql
-- 1) Create subsections table (if not created by Prisma yet)
-- Prefer: npx prisma db push once to create empty tables, then:

-- 2) For each section, insert one default subsection
INSERT INTO subsections (id, title, "order", "sectionId", "createdAt", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), 'General', 1, s.id, NOW(), NOW()
FROM sections s
WHERE NOT EXISTS (SELECT 1 FROM subsections x WHERE x."sectionId" = s.id);

-- 3) Point each lesson at the subsection for its section (pick first subsection per section)
UPDATE lessons l
SET "subsectionId" = (
  SELECT ss.id FROM subsections ss WHERE ss."sectionId" = l."sectionId" ORDER BY ss."order" LIMIT 1
)
WHERE l."subsectionId" IS NULL;

-- 4) Then run prisma migrate / db push to match schema (drop sectionId on lessons)
```

If Prisma already removed `sectionId`, restore from backup and run the SQL in order.

For most dev setups, **`npx prisma db push --accept-data-loss`** on a copy is acceptable; production should use a proper migration.
