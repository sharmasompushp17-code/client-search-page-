# Client Management Web Application

A complete full-stack web application for managing clients, projects, and payments with a modern black & white theme.

## 🚀 Features

### Client Side (No Login Required)
- **Search System**: Access dashboard using client code or name
- **Client Dashboard**: View project details, payment status, and history
- **Payment Integration**: Pay via Razorpay or UPI
- **Work History**: View all past projects and payments

### Admin Side (Protected)
- **Secure Authentication**: JWT-based admin login
- **Client Management**: Add, edit, delete clients with auto-generated codes
- **Project Management**: Create and track projects with status updates
- **Payment Tracking**: Record payments, generate invoices
- **Reports & Analytics**: Charts, earnings, pending payments, monthly reports
- **Email Notifications**: Automatic emails for projects and payments

## 🛠️ Tech Stack

### Frontend
- React.js 18
- React Router DOM
- Axios
- Chart.js (for analytics)
- React Icons
- React Toastify (notifications)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Razorpay API
- Nodemailer

## 📁 Project Structure

```
client-management-app/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Client.js
│   │   ├── Project.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── projects.js
│   │   ├── payments.js
│   │   └── reports.js
│   ├── utils/
│   │   ├── email.js
│   │   └── razorpay.js
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Navbar.js
│       │   └── PrivateRoute.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── AdminLogin.js
│       │   │   ├── AdminDashboard.js
│       │   │   ├── AdminClients.js
│       │   │   ├── AdminProjects.js
│       │   │   ├── AdminPayments.js
│       │   │   └── AdminReports.js
│       │   └── client/
│       │       ├── ClientSearch.js
│       │       └── ClientDashboard.js
│       ├── App.js
│       ├── App.css
│       └── index.js
├── package.json
├── .env
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Razorpay account (for payments)
- Email account (for notifications)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd client-management-app
```

### Step 2: Install Dependencies

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### Step 3: Configure Environment Variables

Edit the `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/client_management

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### Step 4: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

### Step 5: Run the Application

**Development Mode (Both Backend & Frontend):**

```bash
# Terminal 1 - Start Backend
npm run dev

# Terminal 2 - Start Frontend
npm run client
```

**Production Mode:**

```bash
# Build frontend
npm run build

# Start server
npm start
```

### Step 6: Initial Admin Setup

After starting the application, create the first admin:

```bash
curl -X POST http://localhost:5000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Or use Postman/Thunder Client to send the request.

## 📖 Usage Guide

### For Clients

1. **Access Portal**: Visit `http://localhost:3000`
2. **Enter Details**: Input your client code or name
3. **View Dashboard**: See projects, payments, and history
4. **Make Payment**: Click "Pay with Razorpay" or "Pay with UPI"

### For Admin

1. **Login**: Visit `http://localhost:3000/admin/login`
2. **Credentials**: Use the admin email and password
3. **Dashboard**: View overview, charts, and recent activity
4. **Manage Clients**: Add/edit/delete clients
5. **Manage Projects**: Create and track projects
6. **Record Payments**: Log manual payments
7. **View Reports**: Access analytics and download reports

## 🔐 Security Features

- JWT-based authentication for admin
- Password hashing with bcrypt
- Protected admin routes
- CORS enabled
- Helmet.js for security headers
- Input validation and sanitization

## 💳 Payment Integration

### Razorpay
- Automatic order creation
- Payment verification
- Webhook support
- Multiple payment methods

### UPI
- Generate UPI payment links
- Direct UPI payments
- Payment status tracking

## 📧 Email Notifications

Automatic emails are sent for:
- New client registration
- New project added
- Payment received
- Payment reminders

## 📊 Reports & Analytics

- **Dashboard Overview**: Quick stats and charts
- **Earnings Report**: Monthly/yearly earnings breakdown
- **Pending Payments**: Track outstanding amounts
- **Project Status**: Distribution by status and type
- **Client Report**: Top clients and new registrations

## 🎨 Design

- **Theme**: Black & White
- **Style**: Minimal, modern SaaS design
- **Responsive**: Mobile-first approach
- **Animations**: Smooth transitions and hover effects

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin
- `PUT /api/auth/updatepassword` - Update password
- `POST /api/auth/setup` - Initial admin setup

### Clients
- `GET /api/clients/search` - Search client (public)
- `GET /api/clients` - Get all clients (protected)
- `GET /api/clients/:id` - Get single client (protected)
- `POST /api/clients` - Create client (protected)
- `PUT /api/clients/:id` - Update client (protected)
- `DELETE /api/clients/:id` - Delete client (protected)

### Projects
- `GET /api/projects` - Get all projects (protected)
- `GET /api/projects/:id` - Get single project (protected)
- `POST /api/projects` - Create project (protected)
- `PUT /api/projects/:id` - Update project (protected)
- `DELETE /api/projects/:id` - Delete project (protected)

### Payments
- `GET /api/payments` - Get all payments (protected)
- `POST /api/payments/create-order` - Create Razorpay order (public)
- `POST /api/payments/verify` - Verify payment (public)
- `POST /api/payments/upi-link` - Create UPI link (public)
- `POST /api/payments/manual` - Record manual payment (protected)

### Reports
- `GET /api/reports/dashboard` - Dashboard data (protected)
- `GET /api/reports/earnings` - Earnings report (protected)
- `GET /api/reports/pending` - Pending payments (protected)
- `GET /api/reports/projects` - Project report (protected)
- `GET /api/reports/clients` - Client report (protected)

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access for Atlas

### Razorpay Not Working
- Verify Razorpay keys in `.env`
- Check if keys are for test/live mode
- Ensure amount is in paise (multiply by 100)

### Email Not Sending
- Verify email credentials in `.env`
- For Gmail, use App Password
- Check SMTP settings

### Port Already in Use
- Change PORT in `.env`
- Kill process using the port: `lsof -i :5000`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Support

For support, email your-email@example.com or create an issue in the repository.

## 🔄 Updates

### Version 1.0.0
- Initial release
- Complete client management system
- Payment integration with Razorpay
- Email notifications
- Reports and analytics

---

**Built with ❤️ using React, Node.js, and MongoDB**
