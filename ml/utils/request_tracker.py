"""
Request Tracker for ML API
Provides request tracking functionality for Flask ML API
"""

import uuid
import logging
import time
from datetime import datetime, timezone
from flask import request, g, has_request_context
from functools import wraps
import json

def generate_request_id():
    """Generate unique request ID"""
    timestamp = str(int(time.time() * 1000))
    random_part = str(uuid.uuid4())[:8]
    return f"req_{timestamp}_{random_part}"

def setup_request_tracking():
    """Setup tracking ID for current request"""
    request_id = request.headers.get('X-Request-ID', generate_request_id())
    g.request_id = request_id
    return request_id

def log_with_context(level, message, context=None):
    """Log with request context information"""
    request_id = getattr(g, 'request_id', 'unknown')
    
    log_data = {
        'timestamp': datetime.now(timezone.utc).isoformat(),  # ✅ changed here
        'request_id': request_id,
        'level': level,
        'message': message,
        'service': 'ml-api',
        'context': context or {}
    }
    
    log_message = f"[{request_id}] {message}"
    
    if level == 'error':
        logging.error(log_message, extra={'log_data': log_data})
    elif level == 'warn':
        logging.warning(log_message, extra={'log_data': log_data})
    else:
        logging.info(log_message, extra={'log_data': log_data})

def with_request_tracking(f):
    """Decorator: Add request tracking to Flask routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Setup request tracking
        request_id = setup_request_tracking()
        
        # Log request start
        log_with_context('info', f'ML API Request Started', {
            'endpoint': request.endpoint,
            'method': request.method,
            'user_agent': request.headers.get('User-Agent'),
            'remote_addr': request.remote_addr
        })
        
        start_time = time.time()
        
        try:
            # Execute original function
            result = f(*args, **kwargs)
            
            # Log request success
            duration = (time.time() - start_time) * 1000
            log_with_context('info', f'ML API Request Completed', {
                'endpoint': request.endpoint,
                'duration_ms': round(duration, 2),
                'status': 'success'
            })
            
            # Add request ID to response headers
            if hasattr(result, 'headers'):
                result.headers['X-Request-ID'] = request_id
            
            return result
            
        except Exception as error:
            # Log request failure
            duration = (time.time() - start_time) * 1000
            log_with_context('error', f'ML API Request Failed', {
                'endpoint': request.endpoint,
                'duration_ms': round(duration, 2),
                'error': str(error),
                'error_type': type(error).__name__
            })
            
            raise error
    
    return decorated_function

def get_user_context():
    """Get user request context information"""
    return {
        'user_agent': request.headers.get('User-Agent'),
        'remote_addr': request.remote_addr,
        'method': request.method,
        'url': request.url,
        'args': dict(request.args),
        'request_id': getattr(g, 'request_id', 'unknown')
    }

# Configure log format
class RequestTrackingFormatter(logging.Formatter):
    """Custom log formatter with request tracking information"""
    
    def format(self, record):
        # If has structured log data, use JSON format
        if hasattr(record, 'log_data'):
            return json.dumps(record.log_data, ensure_ascii=False)
        
        # Otherwise use standard format
        # request_id = getattr(g, 'request_id', 'unknown') if hasattr(g, 'request_id') else 'unknown'
        
        if has_request_context():
            request_id = getattr(g, 'request_id', 'unknown')
        else:
            request_id = 'unknown'
        
        formatted = super().format(record)
        return f"[{request_id}] {formatted}"

def setup_logging():
    """Configure ML API logging system"""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Create console handler
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    
    # Set format
    formatter = RequestTrackingFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    
    # Clear existing handlers and add new one
    logger.handlers.clear()
    logger.addHandler(handler)
    
    return logger
