-- Drop the existing constraint
ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "contacts_assigned_to_users_id_fk";

-- Add the new constraint that allows NULL values
ALTER TABLE "contacts" 
    ADD CONSTRAINT "contacts_assigned_to_users_id_fk" 
    FOREIGN KEY ("assigned_to") REFERENCES "users"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE; 