# RampForgeAI Troubleshooting Guide

## Common Issues and Solutions

### 1. Content Security Policy (CSP) Errors

**Problem:** Browser shows "Refused to connect" error when frontend tries to connect to backend.

**Symptoms:**
- Console error: "Refused to connect because it violates the document's Content Security Policy"
- API calls from frontend to `http://localhost:8000` fail
- Network tab shows blocked requests

**Solutions:**

#### Quick Fix - Start Services Properly
1. **Start Backend First:**
   ```bash
   npm run dev:backend
   ```
   Verify it's running at http://localhost:8000/api/health

2. **Start Frontend:**
   ```bash
   npm run dev:frontend
   ```
   Verify it's running at http://localhost:3000

3. **Test Connectivity:**
   ```bash
   npm run verify:setup
   ```

#### Alternative - Use Docker (Recommended)
```bash
npm run dev
```
This starts both services with proper networking.

#### Manual Verification
1. Visit http://localhost:3000/test-api to test the connection
2. Check browser console for detailed error messages
3. Verify backend is accessible directly at http://localhost:8000/api/docs

### 2. CORS Issues

**Problem:** Cross-Origin Resource Sharing errors when frontend calls backend.

**Solution:**
The backend is configured to allow requests from:
- http://localhost:3000
- http://127.0.0.1:3000
- http://localhost:3001

If you're running on different ports, update the `CORS_ORIGINS` in `backend/.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
```

### 3. Backend Not Starting

**Problem:** Backend fails to start or crashes.

**Common Causes & Solutions:**

#### Missing Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Database Issues
```bash
cd backend
rm -f rampforge.db  # Remove existing database
python app/main.py  # Restart to recreate tables
```

#### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000  # On macOS/Linux
netstat -ano | findstr :8000  # On Windows

# Kill the process or change port in backend/.env
API_PORT=8001
```

### 4. Frontend Not Starting

**Problem:** Frontend fails to start or shows errors.

**Solutions:**

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Clear Next.js Cache
```bash
cd frontend
rm -rf .next
npm run dev
```

#### Port Issues
If port 3000 is busy, Next.js will automatically use 3001, 3002, etc.
Update CORS_ORIGINS in backend/.env accordingly.

### 5. MCP Service Connection Issues

**Problem:** Cannot connect to GitHub, Jira, or other MCP services.

**Solutions:**

#### Check Credentials
1. Verify API tokens are valid and not expired
2. Ensure tokens have required permissions:
   - **GitHub:** `repo`, `read:user` scopes
   - **Jira:** API token with project access
   - **Azure DevOps:** Personal Access Token with appropriate permissions

#### Network Connectivity
1. Test direct API access from your machine
2. Check if your organization blocks external API calls
3. Verify firewall settings

#### Service Configuration
1. Use correct API endpoints:
   - **GitHub:** `https://api.github.com`
   - **GitLab:** `https://gitlab.com/api/v4` or your instance URL
   - **Jira:** `https://your-domain.atlassian.net`

### 6. Authentication Issues

**Problem:** Login/registration not working.

**Solutions:**

#### Check Backend Logs
```bash
cd backend
python app/main.py
# Watch console for error messages
```

#### Verify Database
```bash
cd backend
# Check if database file exists
ls -la rampforge.db

# If missing, restart backend to recreate
python app/main.py
```

#### Clear Browser Storage
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Clear localStorage and sessionStorage
4. Refresh page

## Getting Help

### Debug Information to Collect

When reporting issues, please include:

1. **System Information:**
   - Operating system
   - Node.js version (`node --version`)
   - Python version (`python --version`)

2. **Service Status:**
   ```bash
   npm run verify:setup
   ```

3. **Browser Console Errors:**
   - Open F12 developer tools
   - Check Console and Network tabs
   - Include any error messages

4. **Backend Logs:**
   - Copy any error messages from backend console
   - Check if backend is accessible at http://localhost:8000/api/docs

### Quick Health Check

Run this command to verify everything is working:
```bash
npm run verify:setup
```

This will test both frontend and backend connectivity and provide specific guidance for any issues found.

### Test Page

Visit http://localhost:3000/test-api for an interactive connection test that will help diagnose API connectivity issues.