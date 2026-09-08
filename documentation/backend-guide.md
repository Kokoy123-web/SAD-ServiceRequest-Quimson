# Backend Guide — Supabase

## 1. What is the backend here?
This exercise uses Supabase as the backend. You do not need PHP, XAMPP, or a separate Node.js server.

The architecture is:

Browser
→ HTML/CSS/JavaScript
→ Supabase JavaScript client
→ HTTPS/API
→ Supabase Authentication + PostgreSQL

GitHub Pages only hosts the static front end.

## 2. Create the Supabase project
1. Go to Supabase and create a new project.
2. Wait until the database is ready.
3. Open the SQL Editor.
4. Copy everything from `sql/schema.sql`.
5. Run the SQL.

## 3. Configure authentication
Open:
Authentication → Users → Add user

Create a test account, for example:
- Email: your school/test email
- Password: a strong test password

Do not put real passwords in README.md or public GitHub files.

## 4. Get the client credentials
Open:
Project Settings → API

Copy:
- Project URL
- Publishable key (or the client-safe anon key, depending on your project UI)

Paste them into `js/supabase.js`.

Never copy the service_role/secret key into JavaScript.

## 5. Understand the database
`service_requests` contains:
- id — automatic request ID
- requester_name — required requester
- department — required department
- category — ICT concern type
- description — problem details
- priority — Low / Medium / High
- status — Pending / In Progress / Completed
- created_at — automatic date/time
- user_id — authenticated user who created the request

## 6. Why RLS matters
Row Level Security is enabled so database access is not simply open to everybody.

SELECT:
Authenticated users can view requests.

INSERT:
The new record's user_id must equal the currently logged-in user's auth.uid().

UPDATE:
The logged-in user can update only records they created.

DELETE:
The logged-in user can delete only records they created.

## 7. How CREATE works
When the form is submitted, JavaScript sends:
requester_name
department
category
description
priority
status = Pending
user_id = currentUser.id

The database automatically generates id and created_at.

## 8. How READ works
The application calls:
`.from("service_requests").select("*")`

Then JavaScript renders the returned records into the table.

## 9. How UPDATE works
The application identifies the request by its id and sends the changed:
- requester_name
- department
- category
- description
- priority
- status

The query also checks user_id, matching the current authenticated user.

## 10. How DELETE works
The browser first displays a confirmation using `window.confirm()`.

Only after confirmation does it send a DELETE request.
The RLS policy then checks whether the logged-in user owns the record.

## 11. Search and filtering
Search checks:
- requester_name
- description

Filters check:
- status
- priority

The dashboard and analytics are recalculated from the loaded Supabase records.

## 12. Local testing
Because the project uses browser JavaScript modules/API calls, use a local server instead of relying on `file://`.

VS Code:
- Install Live Server.
- Right-click `login.html`.
- Choose "Open with Live Server".

Or use Python:
`python -m http.server 5500`

Then open:
`http://localhost:5500/login.html`

## 13. GitHub Pages
1. Create repository: `SAD-ServiceRequest-Lastname`
2. Upload/push the complete project.
3. Commit meaningful stages:
   - Initial project structure
   - Add Supabase database integration
   - Implement CRUD operations
   - Add search filtering and deployment
4. GitHub → Settings → Pages
5. Source: Deploy from a branch
6. Branch: `main`
7. Folder: `/(root)`
8. Save.
9. Wait for deployment.
10. Test the generated GitHub Pages URL.

## 14. Common errors
"Invalid API key":
Check `SUPABASE_URL` and `SUPABASE_KEY`.

"relation service_requests does not exist":
Run `sql/schema.sql`.

"new row violates row-level security policy":
Make sure you are logged in and the inserted `user_id` equals `currentUser.id`.

"UPDATE/DELETE does nothing":
The RLS policy only permits the user who created the record to modify/delete it.

Login redirects back to login:
Check the Supabase Auth account and credentials.

## 15. What you should be able to explain during checking
Be ready to explain:
1. Why Supabase is the backend.
2. What each column in service_requests means.
3. Why user_id is connected to auth.users.
4. What RLS does.
5. How CREATE, READ, UPDATE, and DELETE work.
6. Why new records automatically become Pending.
7. How search and filters work.
8. Why the service_role key must never be placed in frontend code.
9. How GitHub Pages deploys the static frontend.
