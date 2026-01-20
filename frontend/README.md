# Bell Schedule System v2.0 - Modern Edition

A professional, modern web-based bell schedule management system with beautiful UI, animations, and comprehensive features.

## Features

- **Modern UI/UX** with smooth animations and gradients
- **Multi-page application** with React Router
- **Dashboard** with statistics and quick actions
- **Interactive Calendar** with visual date selection
- **Schedule Management** with create, edit, and delete capabilities
- **State Management** using Zustand
- **API Integration** with React Query for caching and optimistic updates
- **Toast Notifications** for user feedback
- **Responsive Design** that works on all devices
- **Professional Animations** using Framer Motion

## Complete File Structure

```
bell-webapp/
│
├── backend/
│   ├── app.py                      # Flask API server
│   ├── requirements.txt            # Python dependencies
│   └── bell_system.db              # SQLite database (auto-created)
│
└── frontend/
    ├── .vscode/
    │   └── settings.json           # VS Code Tailwind settings
    │
    ├── public/
    │   └── (Vite assets)
    │
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx          # Navigation header with animated tabs
    │   │   ├── DayDetailsModal.jsx # Modal for viewing/editing day schedules
    │   │   └── AssignScheduleModal.jsx # Modal for assigning schedules
    │   │
    │   ├── pages/
    │   │   ├── Login.jsx           # Beautiful login page with animations
    │   │   ├── Dashboard.jsx       # Overview dashboard with stats
    │   │   ├── CalendarView.jsx    # Interactive calendar
    │   │   └── ScheduleManagement.jsx # Schedule CRUD interface
    │   │
    │   ├── services/
    │   │   └── api.js              # Axios instance with interceptors
    │   │
    │   ├── store/
    │   │   └── authStore.js        # Zustand auth state management
    │   │
    │   ├── App.jsx                 # Main app with routing
    │   ├── main.jsx                # React entry point
    │   └── index.css               # Tailwind CSS + global styles
    │
    ├── index.html                  # HTML template
    ├── package.json                # Dependencies with React Router, React Query, etc.
    ├── vite.config.js              # Vite config with API proxy
    ├── tailwind.config.js          # Tailwind configuration
    └── postcss.config.js           # PostCSS configuration
```

## Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router DOM** - Client-side routing
- **TanStack React Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **Framer Motion** - Smooth animations
- **date-fns** - Date manipulation
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Vite** - Fast build tool

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - CORS handling
- **SQLite** - Lightweight database

## Installation

### Backend Setup

```bash
cd bell-webapp/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

Backend will run on **http://localhost:5001**

### Frontend Setup

```bash
cd bell-webapp/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will run on **http://localhost:3000**

## Key Features Explained

### 1. Dashboard Page
- **Statistics Cards** showing total schedules, scheduled days, and active assignments
- **Quick Action Cards** for common tasks
- **Recent Assignments** list with dates
- **Animated on load** with staggered card animations

### 2. Calendar View
- **Interactive month calendar** with previous/next navigation
- **Multi-date selection** by clicking dates
- **Visual indicators** (green) for dates with assignments
- **Smooth animations** when selecting dates
- **Quick assign button** appears when dates are selected
- **Click schedule count** to view day details

### 3. Schedule Management
- **Two-column layout**: form on left, list on right
- **Inline editing** with visual feedback
- **Color-coded time chips** for easy reading
- **Delete confirmation** to prevent accidents
- **Real-time updates** using React Query

### 4. Modals
- **Day Details Modal**: View, edit, or delete assignments for a specific date
- **Assign Schedule Modal**: Assign a schedule to multiple selected dates
- **Smooth enter/exit animations**
- **Click outside to close**

### 5. Header
- **Animated active tab indicator** that slides between pages
- **User email display**
- **Logout button**
- **Gradient logo**

### 6. Login Page
- **Beautiful gradient background**
- **Animated bell icon entrance**
- **Form validation**
- **Loading spinner during authentication**

## Usage Guide

### Login
- Email: `boo@crics.asia`
- Password: `crics2025`

### Creating a Schedule
1. Navigate to **Schedules** page
2. Fill in schedule name
3. Enter bell times separated by commas (e.g., `08:00, 10:15, 12:30, 15:00`)
4. Click **Create**

### Assigning Schedules to Dates
1. Go to **Calendar** page
2. Click on dates to select them (they turn blue)
3. Click the **Assign to X Dates** button
4. Select a schedule from the dropdown
5. Optionally add a description
6. Click **Assign Schedule**

### Viewing Day Details
1. On the calendar, click the green schedule count on any date
2. Modal opens showing all assignments
3. Edit or delete assignments directly from the modal

### Editing a Schedule
1. Go to **Schedules** page
2. Click the edit icon on any schedule
3. Modify the form on the left
4. Click **Update**

## API Endpoints

### Authentication
- `POST /api/login` - Login with email and password
- `POST /api/logout` - Logout
- `GET /api/check-auth` - Check if user is authenticated

### Schedules
- `GET /api/schedules` - Get all schedules
- `POST /api/schedules` - Create new schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Assignments
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments?start_date=X&end_date=Y` - Get assignments in date range
- `POST /api/assignments` - Create assignment(s)
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

## Development

### Adding New Features

**Add a new page:**
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Header.jsx`

**Add new API call:**
1. Create function in `src/services/api.js` or use directly in components
2. Use with React Query hooks (`useQuery`, `useMutation`)

**Add new state:**
1. Create new Zustand store in `src/store/`
2. Import and use with hooks

### Build for Production

```bash
cd frontend
npm run build
```

Creates optimized build in `dist/` folder.

## Deployment

### Production Backend (Systemd Service)

```bash
sudo nano /etc/systemd/system/bell-api.service
```

```ini
[Unit]
Description=Bell Schedule API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/bell-webapp/backend
Environment="PATH=/home/pi/bell-webapp/backend/venv/bin"
ExecStart=/home/pi/bell-webapp/backend/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable bell-api
sudo systemctl start bell-api
```

### Production Frontend (Nginx)

```bash
sudo nano /etc/nginx/sites-available/bell-schedule
```

```nginx
server {
    listen 80;
    server_name bellsystem.crics.asia;

    root /home/pi/bell-webapp/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bell-schedule /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Troubleshooting

### Port 5000 in use (macOS)
Backend changed to port 5001 to avoid conflict with AirPlay Receiver.

### CORS Errors
Ensure Flask-CORS is installed and Vite proxy is configured correctly.

### React Query not updating
Check that you're invalidating the correct query keys after mutations.

### Animations not smooth
Ensure Framer Motion is properly installed and imported.

### Tailwind classes not working
Run `npm install` again and ensure PostCSS config is present.

## Performance Optimizations

- **React Query caching** reduces API calls
- **Code splitting** via React Router lazy loading (can be added)
- **Optimistic updates** for instant UI feedback
- **Debounced inputs** for search/filter (can be added)
- **Memoization** of expensive calculations

## Security

- Sessions with HTTP-only cookies
- CORS configuration for specific origin
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping
- HTTPS in production (configure via Nginx)

## Future Enhancements

- [ ] Date range selection with Shift+Click
- [ ] Bulk edit/delete operations
- [ ] Schedule templates
- [ ] Export schedules to PDF/CSV
- [ ] Email notifications
- [ ] Role-based access control
- [ ] Schedule conflicts detection
- [ ] Dark mode
- [ ] Mobile app version

## License

Proprietary - CRICS School Internal Use Only

## Support

Contact your system administrator for support or check the documentation.