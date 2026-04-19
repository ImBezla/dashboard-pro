# DashboardPro - Start-Anleitung

## ⚠️ Voraussetzungen

**Node.js und npm müssen installiert sein!**

### Node.js installieren (falls nicht vorhanden):

**Option 1: Homebrew (empfohlen)**
```bash
# Homebrew installieren (falls nicht vorhanden)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js installieren
brew install node
```

**Option 2: Offizieller Installer**
- Gehe zu: https://nodejs.org/
- Lade die LTS-Version herunter und installiere sie

**Option 3: nvm (Node Version Manager)**
```bash
# nvm installieren
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Terminal neu starten, dann:
nvm install --lts
nvm use --lts
```

### Installation prüfen:
```bash
node --version
npm --version
```

## 🚀 Projekt starten

### 1. Ins Projektverzeichnis wechseln:
```bash
cd "/Users/valentinoeder/Library/Mobile Documents/com~apple~CloudDocs/dashboardpro"
```

### 2. Dependencies installieren:
```bash
npm install
```

### 3. Backend Setup (in neuem Terminal):
```bash
cd "/Users/valentinoeder/Library/Mobile Documents/com~apple~CloudDocs/dashboardpro/apps/api"

# Postgres im Repo-Root starten: docker compose up -d

# .env Datei erstellen
cat > .env << 'EOF'
DATABASE_URL="postgresql://dashboardpro:dashboardpro@localhost:5432/dashboardpro?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3002
FRONTEND_URL="http://localhost:8000"
EOF

# Prisma Client generieren
npm run prisma:generate

# Datenbank migrieren
npm run prisma:migrate

# Optional: Seed (ohne Demo-Inhalte)
# npm run prisma:seed
```

### 4. Backend starten (Terminal 1):
```bash
cd "/Users/valentinoeder/Library/Mobile Documents/com~apple~CloudDocs/dashboardpro/apps/api"
npm run dev
```

### 5. Frontend starten (Terminal 2):
```bash
cd "/Users/valentinoeder/Library/Mobile Documents/com~apple~CloudDocs/dashboardpro/apps/web"
npm run dev
```

### 6. Anwendung öffnen:
Öffne im Browser: **http://localhost:8000**

Zuerst über **Registrieren** ein Konto anlegen, danach einloggen.

## 📝 Wichtige Hinweise

- Standard: **SQLite** (`DATABASE_URL` wie oben); anderes DB-Backend nach Prisma-Doku konfigurieren
- Backend: Port **3002**
- Frontend: Port **8000**
- `.env` in `apps/api` muss passen (inkl. `JWT_SECRET`, `FRONTEND_URL`)

## 🐛 Troubleshooting

**"npm: command not found"**
→ Node.js ist nicht installiert (siehe oben)

**"DATABASE_URL" Fehler**
→ Im Repo-Root `docker compose up -d` (Postgres), dann `DATABASE_URL` in `apps/api/.env` prüfen

**Port bereits belegt**
→ Ändere die Ports in `package.json` oder `.env`

