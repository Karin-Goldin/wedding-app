# Wedding App Deployment Guide for High Concurrency

## 🚀 **Current Improvements Made**

### 1. **Rate Limiting**

- ✅ Server-side upload API with rate limiting (10 uploads/minute per IP)
- ✅ Proper error handling for rate limit exceeded
- ✅ Client-side feedback for rate limits

### 2. **Performance Optimizations**

- ✅ Pagination in gallery (20 files per page)
- ✅ Lazy loading for better performance
- ✅ Optimized image loading with Next.js Image component
- ✅ Removed unnecessary polling (was every 5 seconds)

### 3. **Error Handling**

- ✅ Better error messages in Hebrew
- ✅ Graceful degradation for failed uploads
- ✅ Performance monitoring component

## 📊 **Expected Performance**

### **Current Limits:**

- **Rate Limit:** 10 uploads/minute per IP
- **File Size:** 50MB max per file
- **Concurrent Users:** 300-400 (theoretical)
- **Gallery Loading:** 20 files at a time

### **Supabase Limits to Check:**

- Storage bucket size limits
- API rate limits
- Concurrent connection limits

## 🔧 **Deployment Recommendations**

### 1. **Vercel Deployment**

```bash
# Deploy to Vercel
vercel --prod
```

### 2. **Environment Variables**

Add to your Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://udyuyhbqnbamixqcosqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Supabase Configuration**

- **Storage Bucket:** Ensure `wedding-photos` bucket exists
- **RLS Policies:** Already configured in `supabase/storage.sql`
- **Database:** Consider upgrading plan for higher limits

### 4. **Monitoring Setup**

- Enable performance monitor: `localStorage.setItem('showPerformanceMonitor', 'true')`
- Monitor Vercel analytics
- Set up Supabase dashboard alerts

## ⚠️ **Potential Issues & Solutions**

### **Issue 1: Rate Limiting Too Strict**

If 10 uploads/minute is too restrictive:

```typescript
// In src/app/api/upload/route.ts
const MAX_UPLOADS_PER_MINUTE = 20; // Increase this
```

### **Issue 2: Supabase Storage Limits**

- Check your Supabase plan limits
- Consider implementing file compression
- Add file deduplication logic

### **Issue 3: Memory Issues**

If experiencing memory problems:

```typescript
// In src/components/Gallery.tsx
const FILES_PER_PAGE = 10; // Reduce from 20
```

### **Issue 4: Network Congestion**

- Implement upload queuing
- Add retry logic for failed uploads
- Consider CDN for static assets

## 🧪 **Testing Recommendations**

### **Load Testing**

```bash
# Install artillery for load testing
npm install -g artillery

# Create test scenario
artillery quick --count 100 --num 10 http://your-app.vercel.app
```

### **Manual Testing**

1. Test with 10+ simultaneous uploads
2. Monitor rate limiting behavior
3. Test gallery pagination with 100+ files
4. Verify error handling

## 📈 **Scaling Options**

### **If You Hit Limits:**

1. **Upgrade Supabase Plan**

   - Higher storage limits
   - Better rate limits
   - More concurrent connections

2. **Implement Redis Rate Limiting**

   ```bash
   npm install redis
   # Replace in-memory rate limiting with Redis
   ```

3. **Add CDN**

   - Cloudflare for static assets
   - Better global performance

4. **Implement Upload Queuing**
   - Queue uploads when rate limited
   - Retry failed uploads automatically

## 🎯 **Success Metrics**

Monitor these during your wedding:

- Upload success rate > 95%
- Average upload time < 30 seconds
- Gallery load time < 3 seconds
- Error rate < 5%

## 🚨 **Emergency Contacts**

If the app goes down during the wedding:

1. Check Vercel status page
2. Check Supabase status page
3. Have backup plan (Google Photos, WhatsApp group)

## 💡 **Pro Tips**

1. **Pre-wedding Testing:** Have 50+ people test the app simultaneously
2. **Backup Plan:** Keep a simple Google Photos album as backup
3. **Instructions:** Provide clear instructions to guests about file size limits
4. **WiFi:** Ensure venue has good WiFi coverage
5. **QR Codes:** Print multiple QR codes for easy access

---

**Good luck with your wedding! 🎉**
