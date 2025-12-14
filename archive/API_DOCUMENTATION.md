# MAEPLE API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001/api`  
**Authentication:** JWT Bearer Token  

---

## 🏗️ Architecture Overview

MAEPLE API is a RESTful Node.js + Express backend with PostgreSQL database, featuring:

- **Authentication**: JWT-based with bcrypt password hashing
- **Security**: Rate limiting, input validation, CORS protection
- **Monitoring**: Health checks, performance metrics, comprehensive logging
- **Database**: PostgreSQL with production-ready schema
- **Error Handling**: Comprehensive error responses with proper HTTP status codes

## 🤖 AI Services

### **AI Router**
The application uses a centralized `AIRouter` to manage multiple AI providers with automatic fallback and capability routing.

**Supported Providers:**
- **Gemini**: Text, Vision, Image Gen, Audio (Live)
- **OpenAI**: Text, Vision, Image Gen
- **Anthropic**: Text, Vision
- **Perplexity**: Search (with citations), Chat
- **OpenRouter**: Text, Vision (Access to 100+ models)
- **Ollama**: Local Text, Local Vision (Privacy-first)
- **Z.ai**: Text

#### `getProviderStats()`
Returns usage statistics for all configured providers.

**Returns:**
```typescript
Record<string, {
  providerId: string;
  requestCount: number;
  errorCount: number;
  lastRequestTime: number;
}>
```

#### `connectLive(config)`
Initiates a real-time audio session with a capable provider (e.g., Gemini Live).

**Config:**
```typescript
interface AILiveConfig {
  systemInstruction?: string;
  voice?: string;
  callbacks: {
    onOpen?: () => void;
    onAudioData?: (data: Uint8Array) => void;
    onClose?: () => void;
    onError?: (error: Error) => void;
  };
}
```

---

## 🔐 Authentication

All API endpoints (except `/auth/signup` and `/auth/signin`) require authentication via JWT token.

### **Header**
```
Authorization: Bearer <jwt_token>
```

### **Token Expiration**
- **Duration**: 7 days
- **Secret**: Configurable via `JWT_SECRET` environment variable

---

## 📊 Rate Limiting

### **General API**
- **Limit**: 100 requests per 15 minutes per IP
- **Response**: HTTP 429 with `Retry-After` header

### **Authentication Endpoints**
- **Limit**: 10 requests per 15 minutes per IP
- **Response**: HTTP 429 with error message

---

## 🚀 Endpoints

### **Health & Monitoring**

#### `GET /health/simple`
Quick health check for load balancers.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-14T00:51:40.964Z"
}
```

#### `GET /health`
Comprehensive system health monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-14T00:51:40.964Z",
  "uptime": 191393,
  "performance": {
    "totalRequests": 42,
    "authRequests": 15,
    "entriesRequests": 8,
    "errors": 0,
    "averageResponseTime": 75,
    "responseTimeSamples": [65, 70, 75, 80, 72]
  },
  "database": {
    "status": "connected",
    "responseTime": 5,
    "connections": {
      "total": 20,
      "idle": 18,
      "waiting": 0
    }
  },
  "system": {
    "nodeVersion": "v20.19.6",
    "platform": "linux",
    "memory": {
      "rss": "45 MB",
      "heapUsed": "32 MB",
      "heapTotal": "64 MB",
      "external": "8 MB"
    },
    "cpu": { "user": 1234567, "system": 987654 }
  },
  "lastError": null
}
```

#### `GET /metrics`
Real-time performance metrics for monitoring.

**Response:**
```json
{
  "startTime": 1702531200000,
  "requests": {
    "total": 42,
    "auth": 15,
    "entries": 8,
    "errors": 0
  },
  "responseTimes": [65, 70, 75, 80, 72],
  "databaseConnections": 18,
  "lastError": null,
  "uptime": 191393,
  "timestamp": "2025-12-14T00:51:40.964Z"
}
```

---

### 🔐 Authentication

#### `POST /auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "John Doe",
    "createdAt": "2025-12-14T00:51:40.964Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Missing email or password
- `400` - Password too short (< 6 characters)
- `409` - Email already registered
- `500` - Failed to create account

#### `POST /auth/signin`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "John Doe",
    "createdAt": "2025-12-14T00:51:40.964Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid email or password
- `500` - Failed to sign in

#### `GET /auth/me`
Get current authenticated user profile.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}
```

#### `POST /auth/signout`
Log out user (client-side token deletion, tracked server-side).

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true
}
```

#### `POST /auth/change-password`
Change user password.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `400` - Missing current or new password
- `400` - New password too short (< 6 characters)
- `401` - Current password is incorrect
- `500` - Failed to change password

#### `DELETE /auth/account`
Delete user account permanently.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true
}
```

---

### 📝 Journal Entries

#### `GET /entries`
Get all journal entries for authenticated user.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "entries": [
    {
      "id": "entry_123",
      "type": "journal",
      "timestamp": "2025-12-14T00:51:40.964Z",
      "rawText": "Feeling tired after 3 meetings",
      "mood": 3,
      "moodLabel": "neutral",
      "medications": [],
      "symptoms": [],
      "tags": ["work", "meetings"],
      "activityTypes": ["work"],
      "strengths": [],
      "neuroMetrics": {},
      "sleep": {},
      "notes": "",
      "aiStrategies": [],
      "aiReasoning": "",
      "createdAt": "2025-12-14T00:51:40.964Z",
      "updatedAt": "2025-12-14T00:51:40.964Z"
    }
  ]
}
```

#### `POST /entries`
Create a new journal entry.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "entry": {
    "id": "entry_456",
    "timestamp": "2025-12-14T00:51:40.964Z",
    "rawText": "Feeling tired after 3 meetings",
    "mood": 3,
    "moodLabel": "neutral",
    "medications": [],
    "symptoms": [],
    "tags": ["work", "meetings"],
    "activityTypes": ["work"],
    "strengths": [],
    "neuroMetrics": {},
    "sleep": {},
    "notes": "",
    "aiStrategies": [],
    "aiReasoning": ""
  }
}
```

**Response (201):**
```json
{
  "entry": {
    "id": "entry_456",
    "timestamp": "2025-12-14T00:51:40.964Z",
    "rawText": "Feeling tired after 3 meetings",
    "mood": 3,
    "moodLabel": "neutral",
    "medications": [],
    "symptoms": [],
    "tags": ["work", "meetings"],
    "activityTypes": ["work"],
    "strengths": [],
    "neuroMetrics": {},
    "sleep": {},
    "notes": "",
    "aiStrategies": [],
    "aiReasoning": "",
    "createdAt": "2025-12-14T00:51:40.964Z",
    "updatedAt": "2025-12-14T00:51:40.964Z"
  }
}
```

#### `PUT /entries/:id`
Update an existing journal entry.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "entry": {
    "id": "entry_456",
    "rawText": "Updated journal entry",
    "mood": 4,
    "moodLabel": "good"
  }
}
```

**Response (200):**
```json
{
  "entry": {
    "id": "entry_456",
    "rawText": "Updated journal entry",
    "mood": 4,
    "moodLabel": "good",
    "createdAt": "2025-12-14T00:51:40.964Z",
    "updatedAt": "2025-12-14T01:00:00.000Z"
  }
}
```

**Errors:**
- `404` - Entry not found

#### `DELETE /entries/:id`
Delete a journal entry.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `404` - Entry not found

#### `POST /entries/sync`
Bulk sync entries for initial migration from localStorage.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "entries": [
    {
      "id": "entry_789",
      "rawText": "Historical entry 1",
      "timestamp": "2025-12-10T00:00:00.000Z"
    },
    {
      "id": "entry_790",
      "rawText": "Historical entry 2",
      "timestamp": "2025-12-11T00:00:00.000Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "synced": 2
}
```

---

### ⚙️ Settings

#### `GET /settings`
Get user settings and preferences.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "settings": {
    "cycle_start_date": "2025-12-01",
    "avg_cycle_length": 28,
    "safety_contact": "emergency@example.com",
    "notification_preferences": {
      "enabled": true,
      "frequency": "daily",
      "time": "09:00"
    },
    "sync_enabled": true
  }
}
```

#### `PUT /settings`
Update user settings and preferences.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "settings": {
    "cycle_start_date": "2025-12-01",
    "avg_cycle_length": 28,
    "safety_contact": "emergency@example.com",
    "notification_preferences": {
      "enabled": true,
      "frequency": "daily",
      "time": "09:00"
    },
    "sync_enabled": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "cycle_start_date": "2025-12-01",
    "avg_cycle_length": 28,
    "safety_contact": "emergency@example.com",
    "notification_preferences": {
      "enabled": true,
      "frequency": "daily",
      "time": "09:00"
    },
    "sync_enabled": true
  }
}
```

---

## 🚨 Error Responses

All error responses follow consistent format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (invalid permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🔧 CORS Configuration

### Allowed Origins
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`
- `http://localhost:5176`
- `https://maeple.0reliance.com`

### Allowed Headers
- `Content-Type`
- `Authorization`
- `Origin`

### Credentials
- Credentials are supported for cookie-based authentication

---

## 📝 Request/Response Logging

The API includes comprehensive logging for debugging:

### Log Format
```
[2025-12-14T00:44:08.575Z] POST /api/auth/signin - Request received
[Auth] User signed in: user@example.com
[2025-12-14T00:44:08.650Z] POST /api/auth/signin - Response sent (75ms)
Response data: {"user":{"id":"..."},"token":"..."}
```

### Performance Tracking
- Request/response timestamps
- Response time measurement
- Error tracking and counting
- Database connection monitoring
- Memory and CPU usage tracking

---

## 🛡️ Security Features

### Rate Limiting
- **General API**: 100 requests/15 minutes/IP
- **Auth API**: 10 requests/15 minutes/IP
- **Headers**: `Retry-After` included in 429 responses
- **Storage**: In-memory with automatic cleanup

### Input Validation
- Email format validation
- Password strength requirements (min 6 characters)
- SQL injection protection via parameterized queries
- Request body size limits (10mb max)

### Authentication Security
- **Password Hashing**: bcrypt with salt rounds (10)
- **JWT Security**: HS256 with configurable secret
- **Token Expiration**: 7 days
- **User Verification**: Active user check on each request

---

## 🚀 Deployment

### Environment Variables
```env
API_PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maeple
DB_USER=maeple_user
DB_PASSWORD=secure_password
JWT_SECRET=production_secret_key
```

### Database Setup
```bash
# Create database
createdb maeple

# Create user
createuser maeple_user

# Setup schema
psql -d maeple -f api/schema.local.sql
```

### Process Management
```bash
# Start with PM2
pm2 start api/index.js --name "maeple-api"

# Check logs
pm2 logs maeple-api
```

---

## 📊 Monitoring & Debugging

### Health Monitoring
- **Basic Check**: `GET /health/simple`
- **Full Metrics**: `GET /health`
- **Performance Data**: `GET /metrics`

### Log Analysis
```bash
# View real-time logs
tail -f api/api.log

# Search for errors
grep "ERROR" api/api.log

# Monitor response times
grep "Response sent" api/api.log
```

### Database Monitoring
```sql
-- Active connections
SELECT * FROM pg_stat_activity WHERE datname = 'maeple';

-- Slow queries
SELECT query, mean_time, calls FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Table sizes
SELECT schemaname,tablename,attname,n_distinct FROM pg_stats 
WHERE schemaname = 'public';
```

---

## 🧪 Testing

### Authentication Testing
```bash
# Test signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test"}'

# Test signin
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test authenticated request
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/auth/me
```

### Error Testing
```bash
# Test rate limiting
for i in {1..12}; do
  curl -X POST http://localhost:3001/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Test invalid auth
curl -H "Authorization: Bearer invalid" \
  http://localhost:3001/api/auth/me
```

---

## 📞 Support

### Troubleshooting
1. **Check API Health**: `curl http://localhost:3001/api/health/simple`
2. **Verify Database**: `psql -d maeple -U maeple_user -c "\dt"`
3. **Review Logs**: Check `api/api.log` for error messages
4. **Validate Environment**: Ensure all required variables are set

### Common Issues
- **Port Conflicts**: Use different `API_PORT` or kill existing processes
- **Database Connection**: Verify PostgreSQL is running and credentials are correct
- **Authentication**: Check JWT_SECRET is consistent across restarts
- **CORS Issues**: Ensure frontend origin is in allowed list

---

**API Version:** 1.0.0  
**Last Updated:** December 13, 2025  
**Documentation maintained by:** Poziverse Development Team
