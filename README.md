# Pare

Pare is an AI-powered cover letter generator built for software engineers. Upload your resume, paste a job description, and get a succint, well-crafted cover letter in seconds.

## Features

- **AI-Powered Generation**: Uses Google's Gemini AI (gemma-3-12b-it) to create tailored cover letters based on your resume and job requirements
- **Resume Parsing**: Automatically extracts text from PDF and DOCX resume files
- **Multiple Export Formats**: Download your cover letter as PDF or DOCX
- **Template Management**: Save, edit, and manage your cover letter templates
- **GitHub Authentication**: Secure sign-in with GitHub OAuth

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **TanStack Router** for routing
- **TanStack Query** for data fetching and state management
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Radix UI** for accessible component primitives

### Backend
- **Vercel Serverless Functions** for API endpoints
- **Supabase** for database and authentication
- **Google Gemini AI** for cover letter generation
- **Express** for serverless API structure

### Libraries
- **jsPDF** for PDF generation
- **docx** for DOCX generation
- **pdf.js** for PDF parsing
- **mammoth** for DOCX parsing
- **sonner** for toast notifications

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Supabase account
- Google AI (Gemini) API key
- GitHub OAuth App credentials

### Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create a `.env` file in the `api` directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

For the supabase credentials, please contact me at taahabinmohsin@hotmail.com if you'd like to contribute to this project.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/taahabinmohsin/cover-letter-generator.git
cd cover-letter-generator
```

2. Install frontend dependencies:
```bash
cd frontend
yarn install
```

3. Install API dependencies:
```bash
cd api
yarn install
```

### Database Setup

The database is already set up with the required table and policies in Supabase. No additional setup is required. However, the migrations used are documented under the `api/migrations` directory.

### Development

1. Start the frontend development server:
```bash
cd frontend
yarn dev
```

2. For local API testing with Vercel CLI, from the root directory run:
```bash
vercel dev
```

### Building for Production

Build the frontend:
```bash
cd frontend
yarn build
```

### Deployment

This project is configured for deployment on Vercel. Every push to the main branch will trigger a deployment.

The `vercel.json` configuration handles:
- Frontend build from the `frontend` directory
- API routes as serverless functions
- Proper routing for SPA and API endpoints

## Project Structure

```
cover-letter-generator/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and hooks
│   │   └── routes/       # Route components
│   └── package.json
├── api/                   # Serverless API functions
│   ├── cover-letters.ts  # CRUD operations
│   ├── generate-cover-letter.ts  # AI generation endpoint
│   └── utils.ts          # Shared utilities
└── vercel.json           # Vercel deployment config
```

## Features in Detail

### Cover Letter Generation
- Parses your resume (PDF or DOCX format)
- Analyzes job requirements
- Generates a professional cover letter that:
  - Matches your experience to job requirements
  - Uses proper formatting
  - Includes appropriate salutation and closing
  - Avoids markdown formatting for clean exports
  - Actually sounds like a human

### Template Management
- Save generated cover letters as templates
- Add custom names and descriptions
- Edit saved templates
- Delete templates you no longer need
- View creation dates for easy tracking

### Export Options
- **PDF**: Clean, professional PDF format
- **DOCX**: Editable Microsoft Word format
- **Copy to Clipboard**: Quick copy for pasting anywhere
- **Save as Template**: Save the cover letter as a template for future use (only available when logged in)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Planned Features

- Support for other models/providers
- Support for a custom prompt
- Support for bringing your own API key


