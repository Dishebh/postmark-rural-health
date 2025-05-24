-- Create responders table
CREATE TABLE IF NOT EXISTS responders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT responders_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add responder_id to medical_reports
ALTER TABLE medical_reports
ADD COLUMN IF NOT EXISTS responder_id UUID REFERENCES responders(id) ON DELETE SET NULL;

-- Create assignment audit table
CREATE TABLE IF NOT EXISTS assignment_audit (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES medical_reports(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES responders(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES responders(id) ON DELETE SET NULL,
    CONSTRAINT assignment_audit_report_responder_unique UNIQUE (report_id, responder_id, assigned_at)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assignment_audit_report_id ON assignment_audit(report_id);
CREATE INDEX IF NOT EXISTS idx_assignment_audit_responder_id ON assignment_audit(responder_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_responder_id ON medical_reports(responder_id); 