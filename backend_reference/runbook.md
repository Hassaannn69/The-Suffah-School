# Deployment Runbook

## Maintenance Mode
1.  **Enable**: Update load balancer configuration to point to a static "Maintenance" HTML page.
2.  **Verify**: Access the site URL to ensure traffic is diverted.

## Backup
1.  **Database**: `pg_dump -U user -h host -d edunexus > backup_$(date +%F).sql`
2.  **Verify**: Check file size (`ls -lh`) and tail the file to ensure it's not an error log.

## Deployment Steps
1.  **Code**: Pull latest changes `git pull origin main`.
2.  **Dependencies**: Run `npm install --production`.
3.  **Migrations**: Run `psql -U user -d edunexus -f backend_reference/schema.sql` (Only for init, use migration tool for updates).
4.  **Restart**: `pm2 restart server` or `systemctl restart edunexus`.
5.  **Workers**: Restart queue workers `pm2 restart worker`.

## Verification
1.  **Health Check**: Curl `http://localhost:5000/health`. Expected: `{"status":"healthy"}`.
2.  **Login**: Attempt login with admin account.
3.  **Critical Path**: Create a dummy student, generate a fee, and download the PDF.

## Rollback
1.  **Revert Code**: `git checkout <previous_commit_hash>`
2.  **Restore DB**: `psql -U user -d edunexus < backup_date.sql`
3.  **Restart**: Restart application services.
