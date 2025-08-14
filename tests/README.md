# 🚀 Wedding App Load Testing with k6

This directory contains k6 load testing scripts to validate your wedding app's performance under load.

## 📋 Test Scripts

### 1. `load-test.js` - Comprehensive Load Test

- **Target**: 20 concurrent users
- **Duration**: 3 minutes total
- **Tests**: Upload, Storage Usage, Gallery APIs
- **Use case**: General performance validation

### 2. `upload-stress-test.js` - Upload Focused Stress Test

- **Target**: 20 concurrent users
- **Duration**: 5 minutes total
- **Focus**: File upload performance under stress
- **Use case**: Validate upload API scalability

### 3. `realistic-wedding-test.js` - Realistic Wedding Guest Simulation

- **Target**: Up to 25 concurrent wedding guests
- **Duration**: 13 minutes total (realistic wedding timeline)
- **Focus**: Real-world guest behavior patterns
- **Use case**: Validate app performance during actual wedding scenarios

## 🛠️ Prerequisites

1. **Install k6**:

   ```bash
   # macOS
   brew install k6

   # Windows
   choco install k6

   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Start your wedding app**:
   ```bash
   npm run dev
   ```

## 🧪 Running the Tests

### Local Testing

```bash
# Run comprehensive load test
k6 run tests/load-test.js

# Run upload stress test
k6 run tests/upload-stress-test.js

# Run realistic wedding simulation
k6 run tests/realistic-wedding-test.js

# Test with custom base URL
k6 run -e BASE_URL=http://localhost:3000 tests/realistic-wedding-test.js
```

### Production Testing

```bash
# Test your Vercel deployment
k6 run -e BASE_URL=https://your-app.vercel.app tests/upload-stress-test.js
```

## 📊 Understanding Results

### Key Metrics

- **upload_success_rate**: Percentage of successful uploads
- **upload_duration**: Time taken for uploads (p95, p99)
- **error_rate**: Percentage of failed requests
- **http_req_duration**: Overall request performance

### Thresholds

- **Success Rate**: >90% under stress
- **Response Time**: <15 seconds for 95% of uploads
- **Error Rate**: <10%

## 🎯 What These Tests Validate

✅ **Concurrent Uploads**: Can handle 20+ users uploading simultaneously
✅ **API Performance**: Response times under load
✅ **Error Handling**: Graceful degradation under stress
✅ **Storage Limits**: Supabase storage performance
✅ **Rate Limiting**: Your upload API protection
✅ **Real-world Scenarios**: Actual wedding guest behavior patterns
✅ **Mixed Workloads**: Photos, videos, browsing, and storage checks
✅ **Natural Delays**: Realistic timing between guest actions

## 🔧 Customization

### Adjust Load Parameters

```javascript
// In the test files, modify:
export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp up time
    { duration: "2m", target: 20 }, // Peak load duration
    { duration: "30s", target: 0 }, // Ramp down time
  ],
};
```

### Test Different Scenarios

- **Light Load**: 5-10 users
- **Medium Load**: 20-50 users
- **Heavy Load**: 100+ users
- **Spike Testing**: Sudden load increases

## 🚨 Important Notes

1. **Test Data**: Uses minimal 1x1 pixel images to avoid storage costs
2. **Rate Limiting**: Respects your app's rate limiting
3. **Environment**: Test locally first, then production
4. **Monitoring**: Watch your Supabase dashboard during tests

## 📈 Interpreting Results

### Good Performance

- Success rate >95%
- Response time <10 seconds
- Error rate <5%

### Areas for Improvement

- Success rate <90%
- Response time >15 seconds
- High error rates

### Next Steps

1. **Optimize bottlenecks** identified in tests
2. **Scale resources** if needed (Supabase plans)
3. **Implement caching** for better performance
4. **Add monitoring** for production load

## 🎉 Ready to Test?

### For Realistic Wedding Scenarios

Start with the realistic wedding simulation to test actual guest behavior:

```bash
k6 run tests/realistic-wedding-test.js
```

This simulates real wedding guests with natural delays, varied file sizes, and realistic behavior patterns! 💒📸

### For Performance Validation

Test your core functionality with the upload stress test:

```bash
k6 run tests/upload-stress-test.js
```

This will simulate your wedding day scenario with 20+ guests uploading photos simultaneously! 📸✨
