# 🚗 SmartPark

A full-stack smart parking management system that simplifies parking entry, slot allocation, QR-based ticketing, vehicle exit, billing, and parking-lot monitoring.

Built with **Next.js, TypeScript, MongoDB, Mongoose, JWT, and Tailwind CSS**.

## 🌐 Live Demo

[Smart Parking Management System](http://smart-park-ify.vercel.app/)

---

## ✨ Features

### 👤 User

- Secure registration and login
- Role-based authentication
- Vehicle entry management
- Automatic parking-slot allocation
- Visual parking availability
- QR-based parking ticket generation
- Downloadable parking ticket
- Displays vehicle, slot, entry time, and parking rate

### 👨‍💼 Admin

- Dedicated admin dashboard
- Live parking-slot visualization
- Available and occupied slot indicators
- Ticket activity monitoring
- Configurable hourly parking rate
- QR-based vehicle exit
- Manual Ticket ID fallback
- Automatic parking-duration calculation
- Automatic bill calculation
- Downloadable exit receipt
- Printable receipt

---

# 🏗️ Architecture

SmartPark uses a full-stack Next.js architecture.

```text
                    ┌──────────────────────┐
                    │       Browser        │
                    │                      │
                    │  User / Admin UI     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Next.js        │
                    │                      │
                    │  Frontend + API      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Authentication    │
                    │       + JWT          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       MongoDB        │
                    │                      │
                    │ Users                │
                    │ Parking Slots        │
                    │ Tickets              │
                    │ Configuration        │
                    └──────────────────────┘
````

---

# 🛠️ Tech Stack

| Technology       | Purpose                          |
| ---------------- | -------------------------------- |
| **Next.js**      | Full-stack application framework |
| **React**        | User interface                   |
| **TypeScript**   | Type safety                      |
| **Tailwind CSS** | Styling and responsive design    |
| **MongoDB**      | Database                         |
| **Mongoose**     | MongoDB ODM                      |
| **JWT**          | Authentication and authorization |
| **qrcode**       | QR code generation               |
| **html5-qrcode** | QR code scanning                 |
| **Vercel**       | Deployment                       |

---

# 🔐 Authentication

SmartPark uses **JWT-based authentication** with role-based access.

During registration, users select their role:

```text
USER
ADMIN
```

The backend validates authentication and authorization before allowing protected operations.

### User

```text
Register
   ↓
Login
   ↓
JWT Authentication
   ↓
User Parking Features
```

### Admin

```text
Login
   ↓
JWT Authentication
   ↓
Admin Dashboard
   ↓
Parking & Ticket Management
```

---

# 🚗 Parking Entry Flow

```text
User
 ↓
Login
 ↓
Enter Vehicle Number
 ↓
Find Available Slot
 ↓
Assign Slot
 ↓
Create Parking Ticket
 ↓
Generate QR Code
 ↓
Download Ticket
```

Each parking ticket contains relevant information such as:

* Ticket ID
* Vehicle number
* Parking slot
* Entry time
* Hourly rate
* QR code

---

# 📷 QR-Based Exit

The administrator processes vehicle exits using the generated QR code.

```text
QR Code
   ↓
QR Scanner
   ↓
Ticket ID
   ↓
Ticket Validation
   ↓
Calculate Parking Duration
   ↓
Calculate Bill
   ↓
Complete Exit
   ↓
Free Parking Slot
   ↓
Generate Receipt
```

A **manual Ticket ID option** is also available as a fallback when QR scanning is unavailable.

---

# 💰 Dynamic Parking Rates

Parking rates are configurable by the administrator.

The configured hourly rate is reflected in:

* Parking tickets
* Billing
* Exit receipts

This allows the parking operator to change pricing without modifying application code.

---

# 🅿️ Parking Management

The parking lot is represented using a visual grid.

```text
┌─────┬─────┬─────┬─────┐
│  01 │  02 │  03 │  04 │
│ 🟢  │ 🔴  │ 🟢  │ 🔴  │
├─────┼─────┼─────┼─────┤
│  05 │  06 │  07 │  08 │
│ 🟢  │ 🟢  │ 🔴  │ 🟢  │
└─────┴─────┴─────┴─────┘
```

The dashboard provides an overview of:

* Total parking capacity
* Available slots
* Occupied slots
* Ticket activity

---

# 🧾 Billing & Receipts

After a vehicle exits, the system generates a parking receipt containing:

* Vehicle number
* Parking slot
* Entry time
* Exit time
* Parking duration
* Hourly rate
* Total amount
* Ticket ID

The administrator can **download or print the receipt** for the customer.

---

# 🗄️ Data Model

The application uses MongoDB to persist application state.

### User

```text
User
├── Name
├── Email
├── Password
└── Role
```

### Parking Slot

```text
ParkingSlot
├── Slot Number
├── Occupancy Status
└── Position
```

### Parking Ticket

```text
ParkingTicket
├── Ticket ID
├── Vehicle Number
├── Slot
├── Entry Time
├── Exit Time
├── Rate
├── Amount
└── Status
```

### System Configuration

Stores configurable parking settings such as the hourly parking rate.

---

# 🔄 Application Flow

## Complete User Flow

```text
Register / Login
       ↓
Vehicle Entry
       ↓
Slot Allocation
       ↓
Ticket + QR Generation
       ↓
Vehicle Parks
       ↓
Admin Scans QR
       ↓
Ticket Validation
       ↓
Bill Calculation
       ↓
Exit Processing
       ↓
Slot Released
       ↓
Receipt Generated
```

---

# 📊 Admin Dashboard

The admin dashboard provides centralized control over the parking facility.

### Dashboard includes:

* Parking capacity statistics
* Live parking grid
* Occupancy information
* Ticket activity
* Parking-rate configuration
* Exit management

The ticket activity section is internally scrollable so that a large number of tickets does not disrupt the dashboard layout.

---

# 🚀 Getting Started

## Prerequisites

* Node.js
* npm
* MongoDB

## Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd smartparkingsys
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🌍 Deployment

The application is deployed using **Vercel** with MongoDB as the persistent database.

Production environment variables are configured through the deployment platform.

---

# 🔮 Future Improvements

* Real-time dashboard updates
* Online payment integration
* Parking reservations
* Multiple parking locations
* Parking history
* Advanced analytics
* Vehicle-type based pricing
* Monthly parking passes
* Improved QR scanning across different devices

---

# 👨‍💻 Author

**Priyanshu Dan**

B.E. Information Technology
Jadavpur University

---

