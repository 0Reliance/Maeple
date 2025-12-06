#!/bin/bash
echo "=== MAEPLE App Test ==="
echo ""
echo "1. Checking if server is running..."
if lsof -i :5173 >/dev/null 2>&1; then
    echo "   ✓ Server is running on port 5173"
else
    echo "   ✗ Server not running. Start with: npm run dev"
    exit 1
fi

echo ""
echo "2. Testing HTTP response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:5173 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ Server responding (HTTP $HTTP_CODE)"
else
    echo "   ⚠ Server returned HTTP $HTTP_CODE"
fi

echo ""
echo "3. Checking API key configuration..."
if grep -q "VITE_GEMINI_API_KEY=AIza" .env 2>/dev/null; then
    echo "   ✓ API key configured in .env"
else
    echo "   ✗ API key missing or invalid in .env"
fi

echo ""
echo "4. Testing page content..."
CONTENT=$(curl -s --max-time 5 http://localhost:5173 2>/dev/null)
if echo "$CONTENT" | grep -q "MAEPLE"; then
    echo "   ✓ App HTML loaded"
    echo "   ✓ Title found: $(echo "$CONTENT" | grep -o '<title>.*</title>')"
else
    echo "   ✗ App HTML not loading correctly"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "Next: Open http://localhost:5173 in your browser"
echo "      Check browser console for any JavaScript errors"
