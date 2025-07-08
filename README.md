# Monisha Inventory Management System

A comprehensive inventory management system designed for school uniform retailers. This web application streamlines the process of managing inventory, tracking sales, processing orders, and analyzing business performance.

![Dashboard Preview](https://via.placeholder.com/800x450.png?text=Monisha+Inventory+Dashboard)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Contributing](#contributing)
- [License](#license)

## Overview

Monisha Inventory Management System is a full-featured web application built to help school uniform retailers efficiently manage their inventory, process orders, and track business performance. The system provides a user-friendly interface for staff to handle day-to-day operations while offering powerful analytics tools for management to make informed business decisions.

### Key Objectives

- Streamline inventory management processes
- Track stock levels and automatically flag low stock items
- Process and fulfill customer orders efficiently
- Provide insightful analytics and reporting
- Manage school-specific uniform requirements
- Support multiple user roles with appropriate access controls

## Features

### Inventory Management

- **Batch Inventory**: Create and manage inventory batches with detailed tracking
- **Variant Management**: Track products by type, variant, color, and size
- **Depletion Tracking**: Automatically record when items are depleted with timestamp
- **Low Stock Alerts**: Visual indicators for low stock items

### Order Processing

- **Order Creation**: Create and manage customer orders
- **Order Fulfillment**: Process orders and update inventory automatically
- **Order History**: Track all past orders with detailed information

### School Management

- **School Profiles**: Maintain profiles for each school with specific uniform requirements
- **School-specific Inventory**: Track inventory allocated to specific schools

### User Management

- **Role-based Access Control**: Different access levels for staff, managers, and administrators
- **User Authentication**: Secure login system with Firebase Authentication

### Analytics & Reporting

- **Dashboard**: Visual overview of key business metrics
- **Sales Analytics**: Track sales performance over time
- **Inventory Analytics**: Analyze inventory turnover and stock levels
- **School Analytics**: Insights into school-specific sales and inventory

## Technology Stack

### Frontend

- **React**: UI library for building the user interface
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Framer Motion**: Animation library for smooth transitions
- **Recharts**: Charting library for data visualization
- **React Router**: For navigation and routing

### Backend & Database

- **Firebase**: Backend-as-a-Service platform
  - **Firestore**: NoSQL database for storing application data
  - **Firebase Authentication**: User authentication and authorization
  - **Firebase Storage**: For storing product images and other assets

### State Management

- **Zustand**: Lightweight state management library

### Development Tools

- **Vite**: Build tool and development server
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/monishainventory.git
cd monishainventory
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a Firebase project and configure Firestore database

4. Create a `.env` file in the root directory with your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

## Usage

### User Roles

- **Staff**: Can view inventory, process orders, and perform basic operations
- **Manager**: Can create/edit inventory, manage schools, and access reports
- **Admin**: Full access to all system features and user management

### Core Workflows

#### Inventory Management

1. **Create Batch**: Add new inventory batches with product details
2. **View Inventory**: Browse current inventory levels and details
3. **Update Stock**: Adjust stock levels manually when needed

#### Order Processing

1. **Create Order**: Create new orders for customers
2. **Process Order**: Fulfill orders and update inventory automatically
3. **View Orders**: Track all orders and their status

#### Analytics

1. **Dashboard**: View key metrics at a glance
2. **Reports**: Generate detailed reports for various aspects of the business

## Project Structure

```
monishainventory/
├── public/              # Public assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   ├── inventory/   # Inventory-related components
│   │   ├── orders/      # Order-related components
│   │   ├── schools/     # School-related components
│   │   └── ui/          # Generic UI components
│   ├── config/          # Configuration files
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Layout components
│   ├── pages/           # Page components
│   ├── services/        # Service modules
│   ├── stores/          # Zustand stores
│   ├── styles/          # Global styles
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main App component
│   └── main.jsx         # Entry point
├── .env                 # Environment variables
├── .eslintrc.js         # ESLint configuration
├── .gitignore           # Git ignore file
├── index.html           # HTML template
├── package.json         # Project dependencies
├── README.md            # Project documentation
└── vite.config.js       # Vite configuration
```

## Data Model

### Collections

#### `uniforms`
- Stores information about uniform products
- Fields: name, type, variants, school, etc.

#### `batchInventory`
- Stores inventory batch information
- Fields: name, type, items (array of variants), status, etc.
- Each item contains: variantType, color, price, sizes (array)
- Each size contains: size, quantity, depletedAt (timestamp when depleted)

#### `schools`
- Stores information about schools
- Fields: name, address, contact, status, etc.

#### `orders`
- Stores order information
- Fields: customer, items, totalAmount, status, etc.

#### `staffs` and `managers`
- Stores user information for different roles
- Fields: email, firstName, lastName, role, etc.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

© 2024 Monisha Inventory Management System. All rights reserved.
