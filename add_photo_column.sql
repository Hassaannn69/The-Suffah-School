-- Add photo_url column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to student photos
CREATE POLICY "Public Access to Student Photos" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'student-photos' );

-- Allow authenticated users (like admins) to upload photos
CREATE POLICY "Authenticated Users can upload photos" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update photos
CREATE POLICY "Authenticated Users can update photos" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated Users can delete photos" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );
