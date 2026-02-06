# Suffah School Management System

## Project Setup

This project is a modern web application for school management.

### Prerequisites
- Node.js installed

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

### Running the Project

**IMPORTANT**: To avoid "Blank Screen" issues, you must run the project using the development server. Do not open `index.html` directly from the file system.

1. Start the development server:
   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```

2. Open the URL shown in the terminal (usually `http://localhost:3000`) in your browser.

### Building for Production

To create a production build (optional, as the project runs natively):
```bash
npm run build
```

This will generate bundled assets in `assets/js/`.

## Troubleshooting

- **Blank Screen**: Ensure you are running `npm run dev`. Browser security blocks ES modules when opening files directly (`file://`).
- **Supabase Error**: Ensure your internet connection is active as the project connects to Supabase database.
