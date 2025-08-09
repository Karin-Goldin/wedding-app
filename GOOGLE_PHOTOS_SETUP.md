# Google Photos Backup Setup Guide

## 🎯 **Overview**

This guide will help you set up automatic backup of wedding photos to Google Photos. The backup system will:

- ✅ Create a dedicated Google Photos album for wedding photos
- ✅ Automatically backup all uploaded photos
- ✅ Provide a shareable link to the album
- ✅ Track backup status and progress

## 🔧 **Step 1: Google Cloud Console Setup**

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project

### 1.2 Enable Google Photos Library API

1. Go to "APIs & Services" > "Library"
2. Search for "Google Photos Library API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/google-photos/callback` (for development)
   - `https://your-domain.vercel.app/api/google-photos/callback` (for production)
5. Save the Client ID and Client Secret

## 🔑 **Step 2: Environment Variables**

Add these to your `.env.local` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-photos/callback

# App URL (for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production (Vercel), add these environment variables in your Vercel dashboard.

## 🚀 **Step 3: Usage**

### 3.1 Connect Google Photos Account

1. Go to your wedding app
2. Click the "גיבוי לגוגל פוטוס" (Backup to Google Photos) button
3. Click "התחבר לגוגל פוטוס" (Connect to Google Photos)
4. Authorize the app to access your Google Photos
5. You'll be redirected back to the backup page

### 3.2 Backup Photos

1. Once connected, click "גבה כל התמונות" (Backup all photos)
2. The system will automatically:
   - Download photos from Supabase
   - Upload them to Google Photos
   - Create a shared album
   - Provide a shareable link

### 3.3 Share the Album

- The system creates a shared Google Photos album
- Anyone with the link can view the photos
- You can manage sharing settings in Google Photos

## 📱 **Features**

### Automatic Backup

- Photos are automatically backed up when uploaded
- Batch processing for multiple photos
- Progress tracking and error handling

### Album Management

- Creates a dedicated album: "Yehonatan & Adi Wedding - Guest Photos"
- Automatically shares the album
- Tracks backup status and photo count

### Error Handling

- Graceful handling of upload failures
- Retry mechanisms for failed uploads
- Clear error messages in Hebrew

## 🔒 **Security & Privacy**

### OAuth Security

- Uses secure OAuth 2.0 flow
- Tokens are stored in secure HTTP-only cookies
- No sensitive data is logged or stored

### Data Protection

- Photos are only uploaded to your Google Photos account
- No photos are stored on our servers
- You control all sharing settings

## 🛠️ **Troubleshooting**

### Common Issues

**1. "Failed to connect to Google Photos"**

- Check that Google Photos Library API is enabled
- Verify OAuth credentials are correct
- Ensure redirect URI matches exactly

**2. "Not authenticated with Google Photos"**

- Re-authenticate by clicking the connect button
- Clear browser cookies and try again
- Check if tokens have expired

**3. "Failed to backup photos"**

- Check internet connection
- Verify Google Photos storage space
- Try backing up fewer photos at once

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_GOOGLE_PHOTOS=true
```

## 📊 **Monitoring**

### Backup Status

- Total photos backed up
- Last backup timestamp
- Share link to album

### Performance

- Upload progress tracking
- Batch processing status
- Error rate monitoring

## 🔄 **Manual Backup**

If automatic backup fails, you can:

1. **Download from Supabase**: Use the Supabase dashboard to download photos
2. **Upload to Google Photos**: Manually upload to your Google Photos account
3. **Use the backup page**: Try the backup feature again

## 📞 **Support**

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Google Cloud Console setup
3. Check environment variables are correct
4. Test with a small number of photos first

## 🎉 **Success Indicators**

You'll know it's working when:

- ✅ You can connect to Google Photos
- ✅ Photos appear in your Google Photos album
- ✅ You receive a shareable album link
- ✅ Backup status shows correct photo count

---

**Happy wedding photo backing up! 📸💒**
