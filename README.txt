UPPCL SPOT BILLING DASHBOARD - SETUP (office server)
=====================================================

Files in this folder
  server.js                          the small server program
  UPPCL_Spot_Billing_Dashboard.html  the dashboard page
  README.txt                         this note
  data\snapshots\                    created automatically; holds all saved reports

One-time setup on the office PC that will host the dashboard
  1. Install Node.js (LTS version) from https://nodejs.org if it is not installed.
  2. Keep all files above in one folder, for example C:\UPPCL_Dashboard.
  3. Allow the port through Windows Firewall (default port 8080):
       Windows Security > Firewall > Advanced settings > Inbound Rules > New Rule
       > Port > TCP 8080 > Allow > Private network only.

Start the dashboard
  1. Open Command Prompt in the folder (click the address bar in File Explorer, type cmd, press Enter).
  2. Run:  node server.js
  3. Keep that window open while others use the dashboard. Closing it stops the server.

Use the dashboard
  - On the host PC:          http://localhost:8080
  - On any other office PC:  http://<host-PC-IP>:8080
    (find the IP on the host PC with the command  ipconfig  - look for IPv4 Address)
  - Everyone sees the same saved reports. When a report is uploaded, it is saved on the server.

Backups
  - The server keeps reports in data\snapshots\. Copy that folder to a safe place regularly.
  - The Upload & Manage tab also has Export backup (JSON) and Import backup.

Notes
  - The page loads Chart.js and pdf.js from the internet (cdnjs.cloudflare.com). PCs without internet access will not show charts or read PDFs.
  - There is no password. Only use this on the office network, and do not expose port 8080 to the internet.
  - To start automatically at login, create a shortcut to "node server.js" in the Startup folder, or ask IT to run it as a service.
