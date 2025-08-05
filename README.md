# Monisha Inventory - Management Platform

This is a modern, full-stack inventory management platform for Monisha Uniforms, designed to provide a seamless and efficient way to manage school uniforms, batches, and stock levels. The application is built with a React-based frontend and leverages Firebase for backend services, including authentication, database, and storage.

## Key Features

- **Secure Authentication:** Robust user registration and login with email verification and role-based access control.
- **Dashboard Analytics:** An interactive dashboard providing at-a-glance insights into inventory levels, recent orders, and sales trends.
- **Inventory Management:** A comprehensive system for adding, editing, and tracking uniform products with detailed information, including variants, sizes, and images.
- **Batch Tracking:** Create and manage inventory batches, allowing for efficient stock control and supplier management.
- **School & Student Management:** A dedicated module for managing schools and their uniform requirements, with the ability to associate students with specific schools.
- **Dynamic Reporting:** A powerful reporting tool with dynamic charts that visualize inventory distribution by uniform type and variants, filterable by school.
- **Responsive Design:** A fully responsive and mobile-first design ensures a seamless experience across all devices.

## Tech Stack

### Frontend

- **React:** A JavaScript library for building user interfaces, chosen for its component-based architecture and efficient state management.
- **Vite:** A fast build tool that provides a quicker and leaner development experience for modern web projects.
- **React Router:** For declarative routing in the React application, enabling a multi-page experience.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development and a consistent design system.
- **Framer Motion:** For creating fluid and engaging animations that improve the user experience.
- **Lucide React:** A library of beautiful and consistent icons that enhance the UI's visual appeal.
- **Recharts:** A composable charting library built on React components for creating dynamic and interactive charts.
- **Zustand:** A small, fast, and scalable state-management solution.
- **Lottie React:** For rendering high-quality, lightweight animations, such as the success animation when adding a new product.

### Backend & Services

- **Firebase:** A comprehensive backend-as-a-service (BaaS) platform that provides a suite of tools to build, release, and monitor web applications.
  - **Authentication:** Simplifies the implementation of secure user authentication and role-based access.
  - **Firestore:** A flexible, scalable NoSQL database with real-time capabilities, perfect for an inventory application where live data updates are crucial.
  - **Storage:** Provides a simple and secure way to store and manage user-generated content like product images.

## Project Structure

The project follows a standard React application structure, with a clear separation of concerns:

- **`src/components`**: Contains reusable UI components used throughout the application (e.g., `Button`, `Modal`, `SchoolSelect`).
- **`src/pages`**: Each file in this directory represents a route in the application (e.g., `Dashboard`, `Inventory`, `Reports`).
- **`src/stores`**: Holds the Zustand store definitions for managing global state (e.g., `authStore`, `inventoryStore`, `schoolStore`).
- **`src/config`**:
  - **`firebase.js`**: Initializes and configures the Firebase app.
- **`public`**: Contains static assets like images and icons.

## Component & Page Architecture

The application's architecture is designed to be modular and scalable, with a clear separation between pages and reusable components.

- **Pages (`src/pages`)**: Each file in this directory corresponds to a specific route. Pages are responsible for fetching the data they need from the Zustand stores and composing the UI by assembling various components. For example, the `NewSchools.jsx` page fetches all schools from the `schoolStore` and renders them in a grid or list.

- **Components (`src/components`)**: These are the building blocks of the UI. They are designed to be reusable and are often composed together to create more complex UI structures. Data and callbacks are passed as props from their parent pages.

- **State Management (`src/stores`)**: Global state is managed with Zustand, which provides a simple and efficient way to share state across the application. Each store is responsible for a specific domain (e.g., `authStore` for user authentication, `inventoryStore` for products).

## Page & Component Breakdown

Here is a breakdown of the key pages and the main components they utilize:

- **`Dashboard.jsx` (`/dashboard`):**
  - **Purpose:** Serves as the main landing page, offering a high-level overview of the inventory status, recent orders, and key performance metrics.
  - **Components:**
    - `DashboardHeader`: Displays the main title and a welcome message.
    - `InventoryStatus`: Shows key inventory metrics, such as total items, categories, and low-stock products.
    - `RecentOrders`: A list of the most recent orders with their current status.
    - `DynamicCharts`: Renders various charts to visualize sales trends and inventory data.
    - `SchoolPerformance`: A dedicated chart that displays sales or inventory data broken down by school.

- **`NewSchools.jsx` & `NewSchoolDetails.jsx` (`/schools`):**
  - **Purpose:** Manages all school-related information. The main page lists all schools with search and filter capabilities, while the details page provides an in-depth view of a specific school's students and uniform requirements.
  - **Components:**
    - `SchoolModal`: A dialog used for adding new schools and editing the details of existing ones.
    - `SchoolTabUI`: Provides tabbed navigation on the school details page to switch between student lists and uniform requirements.
    - `ModernStudentList`: Displays a list of all students associated with a specific school.
    - `ModernUniformRequirements`: Shows the specific uniform requirements for a selected school.

- **`Inventory.jsx` & `AddProductNew.jsx` (`/inventory`):**
  - **Purpose:** The core of the inventory management system. The main page displays all uniform products with robust filtering and search options. The "Add Product" page provides a detailed form for creating new uniforms with multiple variants, sizes, and pricing.
  - **Components:**
    - `AdvancedFilterSystem`: A component that allows users to apply complex filters to the product list.
    - `SchoolSelect`: A reusable dropdown component for filtering products by school.
    - `Input` and `Select`: Custom-styled form elements used throughout the creation and editing process to ensure a consistent UI.

- **`Reports.jsx` (`/reports`):**
  - **Purpose:** Provides visual analytics on inventory data. It features dynamic bar charts to show inventory levels by uniform type and variants, with the ability to filter data by school.
  - **Components:**
    - `SchoolSelect`: A dropdown used to filter the report data for a specific school.
    - `BarChart` (from Recharts): The charting component used to visualize inventory data in a clear, readable format.
    - `LoadingScreen`: A user-friendly loading indicator displayed while data is being fetched.

- **`BatchInventory.jsx` & `CreateBatch.jsx` (`/batches`):**
  - **Purpose:** Manages the inventory batches. Users can create new batches of products, track their status, and view detailed information for each batch.
  - **Components:**
    - `BatchModal`: A dialog used for creating and editing inventory batches.
    - `Input` and `Select`: Custom-styled form elements for the batch creation form.

- **`ProfilePage.jsx` (`/profile`):**
  - **Purpose:** Allows users to view and update their personal profile information, including their name, phone number, and profile picture.
  - **Components:**
    - `Input`: Custom-styled input fields for the profile form.
    - `LoadingButton`: A button that displays a loading state during form submission to provide user feedback.

### Example Flow: Displaying Inventory Reports

1. The **`Reports.jsx`** page is rendered when the user navigates to the `/reports` route.
2. The page uses a `SchoolSelect` component to allow the user to filter the reports by school.
3. The `useEffect` hook in **`Reports.jsx`** fetches all uniform data from the `uniforms` collection in Firestore.
4. The data is then processed to calculate the total quantity of each uniform type and variant. If a school is selected, the data is filtered before processing.
5. The processed data is passed to the **`BarChart`** and **`ResponsiveContainer`** components from the Recharts library.
6. The charts are rendered with custom styling, animations, and tooltips to provide a clear and interactive visualization of the inventory data.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/monishainventory-v3.git
   cd monishainventory-v3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase:**
   - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Email/Password provider), **Firestore**, and **Storage**.
   - In your Firebase project settings, add a new web app and copy the `firebaseConfig` object.
   - Replace the placeholder configuration in `src/config/firebase.js` with your own project's configuration.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

### Available Scripts

- **`npm run dev`**: Starts the Vite development server.
- **`npm run build`**: Builds the application for production.
- **`npm run preview`**: Serves the production build locally for previewing.

## Future Enhancements

- **Order Management:** A complete system for creating, tracking, and fulfilling orders.
- **Supplier Management:** A module for managing suppliers and purchase orders.
- **Advanced Filtering & Sorting:** More advanced filtering and sorting options on all data tables.
- **Automated Testing:** Implementation of unit and end-to-end tests to ensure application stability.
- **User Roles & Permissions:** More granular control over user permissions and access levels.
