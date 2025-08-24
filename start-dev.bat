@echo off
echo Starting Phorencial CRM Development Server...
set DATABASE_URL=file:./dev.db
set NEXTAUTH_SECRET=desarrollo-local-secret-key-muy-segura-2024
set NEXTAUTH_URL=http://localhost:3000
set JWT_SECRET=jwt-secret-para-desarrollo-local-2024
set ALLOWED_WEBHOOK_TOKEN=super-seguro
set APP_ENV=development

npx next dev
pause
