-- Create auto_reply_emails table
CREATE TABLE IF NOT EXISTS auto_reply_emails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES medical_reports(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    CONSTRAINT auto_reply_emails_subject_length CHECK (char_length(subject) <= 255)
);

-- Create index for faster lookups by patient_id
CREATE INDEX IF NOT EXISTS idx_auto_reply_emails_patient_id ON auto_reply_emails(patient_id);

-- Create index for faster lookups by created_at
CREATE INDEX IF NOT EXISTS idx_auto_reply_emails_created_at ON auto_reply_emails(created_at DESC);

-- Add comment to table
COMMENT ON TABLE auto_reply_emails IS 'Stores auto-reply emails sent to patients'; 