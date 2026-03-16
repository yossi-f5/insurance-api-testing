const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

// GET /api/customers/me - JWT Signature Bypass (API2:2023)
// This endpoint uses jwt.decode() instead of jwt.verify() - making it vulnerable to signature bypass
router.get('/customers/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Authorization token is required'
    });
  }

  try {
    // 🚨 VULNERABLE: Using jwt.decode() instead of jwt.verify()
    // This means the signature is not verified, allowing tampered tokens
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token could not be decoded'
      });
    }

    // Return customer data based on decoded token (vulnerable to role manipulation)
    const customerData = {
      username: decoded.username,
      role: decoded.role,
      fullName: `${decoded.username.split('.')[0]} ${decoded.username.split('.')[1] || 'User'}`,
      email: `${decoded.username}@example.com`,
      phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      dateOfBirth: '1985-03-15',
      address: {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210'
      }
    };

    res.json(customerData);
  } catch (error) {
    console.error('Error in /customers/me:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process customer data'
    });
  }
});

// GET /api/accounts/overview - Expired Token Acceptance (API2:2023)
// This endpoint uses ignoreExpiration: true - making it vulnerable to expired token attacks
router.get('/accounts/overview', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Authorization token is required'
    });
  }

  try {
    // 🚨 VULNERABLE: Using ignoreExpiration: true
    // This means expired tokens are still accepted
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    
    // Return account overview data
    const accountData = {
      accountType: decoded.role === 'admin' ? 'Enterprise' : 'Standard',
      renewalDate: '2024-12-31',
      monthlyPremium: decoded.role === 'admin' ? 299.99 : 149.99,
      paymentMethod: {
        last4: '1234',
        expiry: '12/25'
      },
      recentTransactions: [
        {
          description: 'Monthly Premium Payment',
          date: '2024-01-15',
          amount: '149.99',
          type: 'debit',
          status: 'Completed'
        },
        {
          description: 'Policy Adjustment Credit',
          date: '2024-01-10',
          amount: '25.00',
          type: 'credit',
          status: 'Completed'
        }
      ],
      paperlessBilling: true,
      autoPay: true,
      emailNotifications: true
    };

    res.json(accountData);
  } catch (error) {
    console.error('Error in /accounts/overview:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process account data'
    });
  }
});

// GET /api/policies/mine - Missing Authentication (API1:2023)
// This endpoint requires no authentication and exposes sensitive policy data
router.get('/policies/mine', (req, res) => {
  // 🚨 VULNERABLE: No authentication required
  // This endpoint exposes sensitive PII without any authentication checks
  
  // Mock policy data with sensitive PII
  const policyData = {
    policyNumber: "INS-123456",
    coverage: "Comprehensive",
    premium: "$500",
    expires: "2026-12-01",
    type: "Auto",
    status: "Active",
    holderName: 'John A. Smith',
    insuredAmount: 500000,
    effectiveDate: '2024-01-01',
    applicationDate: '2023-12-15',
    dateOfBirth: '1985-03-15',
    ssn: '123-45-6789',
    driversLicense: 'CA123456789',
    email: 'john.smith@example.com',
    phone: '+1-555-123-4567',
    address: '123 Main Street, Anytown, CA 90210',
    emergencyContact: {
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '+1-555-987-6543'
    }
  };

  res.json(policyData);
});

// GET /api/admin/stats - Unauthenticated Access to Admin Functions (API5:2023)
// This endpoint requires no authentication and exposes admin statistics
router.get('/admin/stats', (req, res) => {
  // 🚨 VULNERABLE: No authentication required
  // This endpoint exposes sensitive admin data without any authentication checks
  
  // Mock admin statistics data
  const adminStats = {
    totalPolicies: 4520,
    activeClaims: 134,
    totalRevenue: "$2.1M",
    pendingApprovals: 23,
    systemHealth: "Excellent",
    lastBackup: "2024-01-15T10:30:00Z",
    databaseSize: "1.2GB",
    activeUsers: 892,
    failedLogins: 12,
    securityAlerts: 3
  };

  res.json(adminStats);
});

// GET /api/admin/settings - Privilege Escalation to Admin Functions (API5:2023)
// This endpoint requires JWT but has weak role validation
router.get('/admin/settings', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Authorization token is required'
    });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 🚨 VULNERABLE: Weak role validation - accepts any valid token regardless of role
    // This allows standard users to access admin settings
    // The role check is missing or bypassed intentionally
    
    // Mock admin settings data
    const adminSettings = {
      maintenanceMode: false,
      version: "v3.2.1",
      allowedIPs: ["127.0.0.1", "192.168.1.0/24", "10.0.0.0/8"],
      databaseConfig: {
        host: "db-insurance-prod.company.com",
        port: 5432,
        name: "insurance_prod"
      },
      securitySettings: {
        maxLoginAttempts: 5,
        sessionTimeout: 3600,
        requireMFA: false
      },
      backupSettings: {
        frequency: "daily",
        retention: "30 days",
        location: "/backups/prod"
      }
    };

    res.json(adminSettings);
  } catch (error) {
    console.error('Error in /admin/settings:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
});

// POST /api/support/contact - Missing Authentication on Destructive Endpoint (API1:2023)
// This endpoint allows contact form submission without authentication
router.post('/support/contact', (req, res) => {
  // 🚨 VULNERABLE: No authentication check - anyone can submit contact forms
  
  // Check for missing fields
  if (!req.body) {
    return res.status(400).json({
      error: 'Request body is missing',
      message: 'Please provide contact information'
    });
  }
  
  const { name, email, message } = req.body;
  
  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Name, email, and message are required'
    });
  }
  
  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
      message: 'Please provide a valid email address'
    });
  }
  
  // Success response - no authentication required
  res.status(200).json({
    message: 'Contact form submitted successfully',
    ticketId: `TKT-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    submittedBy: 'anonymous', // Shows no authentication was required
    vulnerability: 'Missing authentication on contact endpoint'
  });
});

// POST /api/documents/preview - SSRF via Document Preview (API7:2023)
// This endpoint performs HTTP requests to a hardcoded URL - vulnerable to SSRF
router.post('/documents/preview', async (req, res) => {
  try {
    // 🚨 VULNERABLE: Hardcoded URL without validation
    // In a real implementation, this would be configurable and vulnerable to SSRF
    const targetUrl = "http://example.com/report-preview";
    
    console.log('🔍 SSRF: Making request to hardcoded URL:', targetUrl);
    
    // 🚨 VULNERABLE: Perform HTTP request without domain/protocol validation
    try {
      // Simulate HTTP request (in real implementation, this would use fetch/axios)
      // This is vulnerable because it doesn't validate the URL
      const mockResponse = {
        status: 200,
        content: "Fetched content from example.com/report-preview\n\nThis is a sample document preview that would normally be fetched from an external service. In a vulnerable implementation, this URL could be manipulated to access internal services or external malicious sites.\n\nDocument ID: DOC-2024-001\nGenerated: 2024-01-15\nStatus: Active\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
      };
      
      // 🚨 VULNERABLE: Return content from potentially malicious URL
      return res.status(200).json({
        content: mockResponse.content,
        fetchedAt: new Date().toISOString(),
        url: targetUrl
      });
      
    } catch (error) {
      console.error('🔍 SSRF request failed:', error);
      return res.status(500).json({
        error: 'Document preview failed',
        code: 'PREVIEW_ERROR',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('🔍 Document preview error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/admin/settings - Mass Assignment Privilege Escalation (API6:2023)
// This endpoint is vulnerable to mass assignment - accepts and stores unexpected fields
// 🚨 VULNERABLE: Should be admin-only but standard users can access it
router.put('/admin/settings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔍 User updating admin settings:', decoded.username, 'Role:', decoded.role);

    // 🚨 VULNERABLE: Authorization influenced by client-supplied fields (mass assignment)
    // If the caller injects { isAdmin: true } or { role: 'admin' } in the body,
    // treat the request as admin even if the user is not an admin by role.
    const incoming = { ...req.body };
    const requestedIsAdmin = incoming.isAdmin === true || incoming.role === 'admin';
    const effectiveRole = requestedIsAdmin ? 'admin' : decoded.role;

    // Deny access to regular users unless they injected admin fields above
    if (effectiveRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required to access settings',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }
    
    // 🚨 VULNERABLE: Accept ALL fields from request body without validation
    const userSettings = {
      ...incoming, // 🚨 No field filtering or validation
      updatedBy: decoded.username,
      updatedAt: new Date().toISOString()
    };
    
    console.log('🔍 Mass Assignment - Storing all fields:', userSettings);
    
    // 🚨 VULNERABLE: Store all fields including malicious ones (simulated)
    const mockUserSettings = {
      [decoded.username]: userSettings
    };
    
    console.log('🔍 Stored admin settings:', JSON.stringify(mockUserSettings, null, 2));
    
    return res.status(200).json({
      message: 'Admin settings updated successfully',
      settings: userSettings,
      user: {
        username: decoded.username,
        role: userSettings.role || effectiveRole, // 🚨 Role can be overwritten by payload
        isAdmin: userSettings.isAdmin || (effectiveRole === 'admin') // 🚨 isAdmin can be set by payload
      }
    });
    
  } catch (error) {
    console.error('🔍 Admin settings update error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/reports - Admin Reports (Safe Method)
// This endpoint requires admin role for GET requests
router.get('/admin/reports', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Authorization token is required'
    });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // ✅ SECURE: Check role for GET requests
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required to access reports',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }
    
    // Mock admin reports data
    const adminReports = {
      monthlyRevenue: {
        total: "$1.2M",
        policies: 2340,
        claims: 89,
        netProfit: "$450K"
      },
      userActivity: {
        activeUsers: 892,
        newRegistrations: 45,
        loginAttempts: 1234,
        failedLogins: 23
      },
      systemMetrics: {
        uptime: "99.9%",
        responseTime: "120ms",
        databaseConnections: 45,
        cacheHitRate: "87%"
      },
      securityReport: {
        suspiciousActivities: 12,
        blockedIPs: 8,
        failedAuthAttempts: 156,
        lastSecurityScan: "2024-01-15T08:00:00Z"
      },
      generatedAt: new Date().toISOString(),
      reportPeriod: "January 2024"
    };

    res.json(adminReports);
  } catch (error) {
    console.error('Error in /admin/reports GET:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
});

// DELETE /api/admin/reports - HTTP Method Bypass (API5:2023)
// 🚨 VULNERABLE: This endpoint does NOT check role for DELETE requests
router.delete('/admin/reports', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Authorization token is required'
    });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 🚨 VULNERABLE: No role check for DELETE requests
    // This allows standard users to perform admin actions by switching HTTP methods
    // In a secure implementation, this should also check for admin role
    // if (decoded.role !== 'admin') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }
    
    console.log('🔍 HTTP Method Bypass - User clearing reports:', decoded.username, 'Role:', decoded.role);
    
    // 🚨 VULNERABLE: Allow any authenticated user to clear admin reports
    // This simulates a sensitive admin action that should be restricted
    const mockResponse = {
      status: "Reports archive cleared",
      clearedBy: decoded.username,
      userRole: decoded.role,
      clearedAt: new Date().toISOString(),
      affectedReports: [
        "monthly_revenue_2024_01",
        "user_activity_2024_01", 
        "system_metrics_2024_01",
        "security_report_2024_01"
      ],
      message: "All admin reports have been archived and cleared from the system"
    };

    res.status(200).json(mockResponse);
  } catch (error) {
    console.error('Error in /admin/reports DELETE:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
});

// GET /api/policies/search - Excessive Record Retrieval (API4:2023)
// This endpoint is vulnerable to excessive record retrieval - no pagination limits enforced
router.get('/policies/search', (req, res) => {
  try {
    const { query = '', page = 1, per_page = 10 } = req.query;
    
    console.log('🔍 Policy search request:', { query, page, per_page });
    
    // 🚨 VULNERABLE: No maximum limit enforced on per_page parameter
    // This allows attackers to retrieve excessive records by setting per_page=1000
    const limit = parseInt(per_page);
    const offset = (parseInt(page) - 1) * limit;
    
    // Generate 1000+ mock policies
    const generateMockPolicies = (count) => {
      const policies = [];
      const statuses = ['Active', 'Expired', 'Pending', 'Processing', 'Approved'];
      const coverages = ['Auto', 'Home', 'Health', 'Life', 'Business'];
      const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
      
      for (let i = 1; i <= count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const holderName = `${firstName} ${lastName}`;
        
        policies.push({
          id: i,
          policyNumber: `POL-${String(i).padStart(6, '0')}`,
          holderName: holderName,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          coverage: coverages[Math.floor(Math.random() * coverages.length)],
          expiresOn: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 5000).toISOString().split('T')[0]
        });
      }
      
      return policies;
    };
    
    // Generate all policies (1000+ records)
    const allPolicies = generateMockPolicies(10000);
    
    // Filter by query if provided
    let filteredPolicies = allPolicies;
    if (query) {
      const queryLower = query.toLowerCase();
      filteredPolicies = allPolicies.filter(policy => 
        policy.holderName.toLowerCase().includes(queryLower) ||
        policy.policyNumber.toLowerCase().includes(queryLower) ||
        policy.status.toLowerCase().includes(queryLower) ||
        policy.coverage.toLowerCase().includes(queryLower)
      );
    }
    
    // 🚨 VULNERABLE: No maximum limit check - can return thousands of records
    const totalPolicies = filteredPolicies.length;
    const totalPages = Math.ceil(totalPolicies / limit);
    const paginatedPolicies = filteredPolicies.slice(offset, offset + limit);
    
    console.log(`🔍 Returning ${paginatedPolicies.length} policies out of ${totalPolicies} total`);
    console.log(`🔍 Page ${page} of ${totalPages}, per_page=${per_page}`);
    
    // 🚨 VULNERABLE: Returns excessive records if per_page is tampered with
    const response = {
      policies: paginatedPolicies,
      pagination: {
        page: parseInt(page),
        per_page: limit,
        total: totalPolicies,
        totalPages: totalPages
      },
      searchQuery: query,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('🔍 Policy search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search policies',
      code: 'SEARCH_ERROR'
    });
  }
});

module.exports = router; 