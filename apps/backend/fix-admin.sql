-- Update admin user to have product_admin user type
UPDATE users 
SET "userType" = 'product_admin'
WHERE email = 'admin@eventbooking.com';

-- Verify the update
SELECT id, email, "userType", "firstName", "lastName" 
FROM users 
WHERE email = 'admin@eventbooking.com';
