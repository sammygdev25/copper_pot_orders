# Copper Pot Orders

Restaurant ordering app for Copper Pot Kitchen with menu browsing, cart checkout, online payment, order tracking and staff order/menu management

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate --run-syncdb
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

## Tech Stack

- **Backend**: Django >= 4.2 + Django REST Framework
- **Frontend**: React 18 + React Router 6
- **Database**: SQLite (development)
- **Auth**: Token Authentication
