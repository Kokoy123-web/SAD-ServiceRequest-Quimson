# SAD Service Request Management System

A responsive ICT Service Request Management System for the Systems Analysis and Design Laboratory Exercise 3.

## Stack
- HTML
- CSS
- JavaScript
- Supabase Authentication
- Supabase PostgreSQL
- Supabase Row Level Security
- GitHub Pages

## Required Features
- Login / logout / session management
- Dashboard summary
- Create, Read, Update, Delete service requests
- Search requester name or description
- Filter by status and priority
- Input validation
- Delete confirmation
- Request analytics by category and priority
- Responsive maximalist UI

## Setup
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `sql/schema.sql`.
4. Create a test account under Authentication > Users.
5. Copy your Supabase Project URL and Publishable/Anon key.
6. Put them in `js/supabase.js`.
7. Open the project locally with a local server.
8. Push the files to GitHub.
9. Enable GitHub Pages from `main` and `/ (root)`.

## Security
Do NOT use the Supabase `service_role` key in the browser.
The browser must only use the client-safe publishable/anon key.
RLS policies protect database access.

## Important exercise rule
You should understand and be able to explain the database, CRUD functions, authentication, RLS, JavaScript, and deployment during checking.
