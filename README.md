# Tuition Management System (TMS)

A high-performance, full-featured web application for managing tuition students, classes, fees, and payments.

## Features

- ✅ **Student Management**: Add, view, search, filter, and delete students
- ✅ **Class Tracking**: Mark completed classes with date picker, track monthly progress
- ✅ **Payment Management**: Record payments with full history and due amount calculation
- ✅ **Notes System**: Add, edit, and delete student-specific notes
- ✅ **Dashboard**: Real-time stats, progress bars, and recent activity
- ✅ **Monthly Reset**: Start new month while preserving fees history and notes
- ✅ **Premium UI**: Dark theme with glassmorphism, gradients, and smooth animations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account

### 2. Database Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `schema.sql` to create all tables and policies

### 3. Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   You can find these in your Supabase project settings under "API".

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Adding a Student

1. Navigate to the **Students** page
2. Click **Add Student**
3. Fill in the form:
   - Name
   - Class
   - Contact
   - Monthly Class Target
   - Fees Per Month
4. Click **Add Student**

### Managing Student Details

1. Click **View** on any student card
2. In the modal, you can:
   - **Track Classes**: Add completed classes with dates
   - **Record Payments**: Add payments with amount and date
   - **Manage Notes**: Add or delete student-specific notes
   - **Update Monthly Target**: Change the monthly class target
   - **Start New Month**: Reset classes while keeping history

### Dashboard

The dashboard shows:
- Total students count
- Classes completed today and this month
- Pending and paid fees count
- Monthly progress bar
- Recent payments list

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your environment variables in Vercel project settings
4. Deploy!

### Other Platforms

You can deploy to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

Make sure to:
1. Set the build command to `npm run build`
2. Set the output directory to `.next`
3. Add your environment variables

## Database Schema

### Students Table
- `id`: UUID (Primary Key)
- `name`: Text
- `class`: Text
- `contact`: Text
- `monthly_target_classes`: Integer
- `fees_per_month`: Numeric
- `created_at`: Timestamp

### Classes Table
- `id`: UUID (Primary Key)
- `student_id`: UUID (Foreign Key)
- `date`: Date
- `completed_count`: Integer
- `created_at`: Timestamp

### Payments Table
- `id`: UUID (Primary Key)
- `student_id`: UUID (Foreign Key)
- `amount`: Numeric
- `date`: Date
- `month`: Text
- `year`: Integer
- `created_at`: Timestamp

### Notes Table
- `id`: UUID (Primary Key)
- `student_id`: UUID (Foreign Key)
- `note_text`: Text
- `created_at`: Timestamp

## License

MIT
