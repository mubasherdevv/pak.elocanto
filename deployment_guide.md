# Namecheap VPS Deployment Guide (React + Node.js)

Follow these steps to deploy your SEO-optimized application on a clean Namecheap VPS.

## 1. Initial Server Preparation
Connect to your VPS via SSH and update the system:
```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js (Version 20.x):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Install Git and Nginx:
```bash
sudo apt install git nginx -y
```

Install PM2 globally:
```bash
sudo npm install pm2 -g
```

## 2. Clone and Setup Project
Go to your web directory and clone the repository:
```bash
cd /var/www
git clone https://github.com/mubasherdevv/elocanto.git
cd elocanto
```

### Setup Environment Variables
Create a `.env` file in the `backend` directory:
```bash
cd backend
nano .env
```
Paste your production environment variables (MONGO_URI, PORT=5000, etc.).

## 3. Build Frontend
This is critical for SSR-Lite to work correctly:
```bash
cd ../frontend
npm install
npm run build
```
*Note: This will create a `dist` folder which the backend will serve.*

## 4. Setup Backend
```bash
cd ../backend
npm install
```

## 5. Run with PM2
Start the server and ensure it restarts on boot:
```bash
pm2 start server.js --name elocanto-ssr
pm2 save
pm2 startup
```

## 6. Configure Nginx (Reverse Proxy)
Create a configuration for your domain:
```bash
sudo nano /etc/nginx/sites-available/pk.elocanto.com
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name pk.elocanto.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/pk.elocanto.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. SSL (HTTPS) - Optional but Recommended
Install Certbot for free SSL:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d pk.elocanto.com
```

---

### Important Commands for Maintenance:
- **Restarting App**: `pm2 restart elocanto-ssr`
- **Viewing Logs**: `pm2 logs elocanto-ssr`
- **Checking Build**: If you change frontend code, always run `npm run build` in the `frontend` folder and then `pm2 restart elocanto-ssr`.
