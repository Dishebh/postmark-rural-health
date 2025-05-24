# Rural Health Triage System

A Node.js application that processes inbound medical reports via email using Postmark's inbound email processing feature. This system helps in triaging medical reports from rural areas by extracting symptoms, patient information, and location data from emails.

## Features

- Email ingestion via Postmark webhook
- Basic NLP for extracting:
  - Symptoms
  - Patient names
  - Location information
- Supabase PostgreSQL database integration
- Secure API endpoints
- Error handling and logging

## Prerequisites

- Node.js (v14 or higher)
- Supabase account and project
- Postmark account with inbound email processing enabled

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3000
   NODE_ENV=development
   ```

4. Create the following table in your Supabase database:
   ```sql
   create table medical_reports (
     id uuid default uuid_generate_v4() primary key,
     email text not null,
     subject text not null,
     symptoms text[],
     location text,
     patient_name text,
     created_at timestamp with time zone default now()
   );
   ```

5. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### POST /inbound-email
Receives inbound email data from Postmark webhook.

Request body example:
```json
{
  "From": "patient@example.com",
  "Subject": "Medical Report",
  "TextBody": "My name is John Doe. I have fever and cough. I live in a village near Jaipur."
}
```

### GET /health
Health check endpoint.

## Development

The application uses:
- Express.js for the web server
- Supabase for database
- Postmark for email processing
- Helmet for security
- CORS for cross-origin requests

## Security Considerations

- All endpoints are protected with Helmet security headers
- CORS is enabled for API access
- Environment variables are used for sensitive data
- Input validation is implemented
- Error handling is in place

## License

MIT 