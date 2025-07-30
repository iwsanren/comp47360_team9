import { NextResponse } from "next/server";

import { withRequestTracking, sendErrorResponse } from '@/middleware/requestTracker';
import { logWithContext, generateRequestId } from '@/utils/requestTracker';

export const runtime = 'nodejs'; 

async function contactHandler(req, requestId) {
  logWithContext(requestId, 'info', 'Processing contact form submission');
  
  const formData = await req.formData();
  const response = await fetch('https://script.google.com/macros/s/AKfycbyrdIKQAe0wQFWitN9-u87xo3Coj0nxHYHqL-GlNvamGOzTaeC_wPUQimumgQsazdsh/exec', { 
    method: 'POST', 
    body: formData, 
    duplex: 'half' 
  });
  
  if (!response.ok) {
    throw new Error(`Google Apps Script responded with status: ${response.status}`);
  }
  
  const message = await response.json();
  
  logWithContext(requestId, 'info', 'Contact form submitted successfully');
  
  const result = NextResponse.json(message);
  result.headers.set('X-Request-ID', requestId);
  return result;
}

export const POST = withRequestTracking(async (req) => {
  const requestId = req.headers.get('x-request-id') || generateRequestId();
  
  try {
    return await contactHandler(req, requestId);
  } catch (error) {
    return sendErrorResponse(requestId, 'Failed to store message', 500, {
      error: error.message
    });
  }
});