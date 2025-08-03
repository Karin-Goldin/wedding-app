-- Create a policy to allow public uploads
create policy "Enable public uploads"
on storage.objects for insert
with check (bucket_id = 'wedding-photos');

-- Create a policy to allow public downloads
create policy "Enable public downloads"
on storage.objects for select
using (bucket_id = 'wedding-photos');

-- Create a policy to allow public updates
create policy "Enable public updates"
on storage.objects for update
using (bucket_id = 'wedding-photos')
with check (bucket_id = 'wedding-photos');

-- Create a policy to allow public deletes
create policy "Enable public deletes"
on storage.objects for delete
using (bucket_id = 'wedding-photos'); 