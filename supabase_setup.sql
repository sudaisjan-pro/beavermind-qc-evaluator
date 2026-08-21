-- Create an enum for call types
CREATE TYPE call_type AS ENUM ('kickoff', 'coaching');

-- Create an enum for evaluation status
CREATE TYPE evaluation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create the evaluations table
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_type call_type NOT NULL,
    transcript TEXT NOT NULL,
    status evaluation_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    score_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Set up Row Level Security (RLS)
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write for the sake of the exercise (adjust in production/auth layer)
CREATE POLICY "Allow public inserts" ON evalua  tions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public selects" ON evaluations FOR SELECT TO public USING (true);
CREATE POLICY "Allow public updates" ON evaluations FOR UPDATE TO public USING (true);
