import User from '../models/User.js';
import { verifyToken } from '../config/jwt.js';

// Middleware to protect routes (verify JWT)
const protect = async (req, res, next) => {
  let token = null;

  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const [, bearer] = req.headers.authorization.split(' ');
    token = bearer && bearer.trim();
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }
    
    if (!req.user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    if (req.user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ error: 'Token is no longer valid' });
    }
    
    next();
  } catch {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

// Middleware to check admin role
const admin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

export { protect, admin };