const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Microsoft Graph API configuration
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
const TENANT_ID = "";
const CLIENT_ID = "";
const CLIENT_SECRET = "";
const GROUP_ID = "";

// Get access token for Microsoft Graph API
async function getAccessToken() {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default'
    });

    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}

// Check if user is member of the specified group
async function checkGroupMembership(email, accessToken) {
  console.log('=== checkGroupMembership function called ===');
  console.log('Email parameter:', email);
  console.log('Access token length:', accessToken ? accessToken.length : 'undefined');
  
  try {
    console.log('=== Starting group membership check ===');
    
    // First, get the user by email to get their ID
    let userId;
    try {
      const userResponse = await axios.get(
        `${GRAPH_API_BASE}/users/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      userId = userResponse.data.id;
      console.log('User found with ID:', userId);
    } catch (userError) {
      console.log('User not found by email:', email);
      return {
        isMember: false,
        userDetails: null,
        error: 'User not found with the provided email'
      };
    }
    
    // Method 1: Check using the members/$ref endpoint
    try {
      const membershipResponse = await axios.get(
        `${GRAPH_API_BASE}/groups/${GROUP_ID}/members/$ref`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Debug: Print the full membership response
      console.log('=== Membership Response Debug ===');
      console.log('Full response:', JSON.stringify(membershipResponse.data, null, 2));
      console.log('Members array:', membershipResponse.data.value);
      console.log('================================');
      
      // Check if the user ID exists in the group members
      const members = membershipResponse.data.value;
      
      // The members array contains objects with @odata.id property, not direct id
      // We need to extract the user ID from the @odata.id URL
      const isMember = members.some(member => {
        console.log('=== Processing Member ===');
        console.log('Raw member object:', JSON.stringify(member, null, 2));
        
        let memberId;
        
        // First, try to get the ID from the @odata.id field
        if (member['@odata.id']) {
          const odataId = member['@odata.id'];
          console.log('@odata.id found:', odataId);
          
          // Handle different formats of @odata.id
          if (odataId.includes('directoryObjects/')) {
            // Format: https://graph.microsoft.com/v1.0/directoryObjects/{userId}
            memberId = odataId.split('directoryObjects/')[1];
          } else if (odataId.includes('users/')) {
            // Format: https://graph.microsoft.com/v1.0/users/{userId}
            memberId = odataId.split('users/')[1];
          } else if (odataId.includes('/')) {
            // Generic URL format - take the last part
            memberId = odataId.split('/').pop();
          } else {
            // Direct ID or type identifier
            memberId = odataId;
          }
        } else if (member.id) {
          // Fallback to direct id field
          memberId = member.id;
          console.log('Using direct id field:', memberId);
        } else {
          console.log('No ID found in member object');
          return false;
        }
        
        // Clean up the memberId - remove any query parameters or fragments
        if (memberId && memberId.includes('?')) {
          memberId = memberId.split('?')[0];
        }
        if (memberId && memberId.includes('#')) {
          memberId = memberId.split('#')[0];
        }
        
        // Additional check: if memberId contains a type identifier like "Microsoft.DirectoryServices.User",
        // we need to extract the actual GUID from it
        if (memberId && memberId.includes('.')) {
          // Try to extract GUID from the type identifier
          const guidMatch = memberId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if (guidMatch) {
            memberId = guidMatch[0];
            console.log('Extracted GUID from type identifier:', memberId);
          }
        }
        
        console.log('Final memberId:', memberId);
        console.log('Comparing with userId:', userId);
        console.log('Match result:', memberId === userId);
        console.log('=== End Processing Member ===');
        
        return memberId === userId;
      });
      
      // Debug: Print the isMember value
      console.log('=== Group Membership Check Debug ===');
      console.log('Email:', email);
      console.log('User ID:', userId);
      console.log('Group ID:', GROUP_ID);
      console.log('Total members in group:', members.length);
      console.log('Is Member:', isMember);
      console.log('=====================================');

      return {
        isMember,
        userDetails: {
          id: userId,
          email: email
        }
      };
    } catch (refError) {
      console.log('Method 1 failed, trying Method 2...');
      
      // Method 2: Check using the members endpoint (returns full user objects)
      const membersResponse = await axios.get(
        `${GRAPH_API_BASE}/groups/${GROUP_ID}/members`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('=== Members Response Debug ===');
      console.log('Members response:', JSON.stringify(membersResponse.data, null, 2));
      
      const members = membersResponse.data.value;
      
      // Method 2: Check each member with detailed logging
      const isMember = members.some(member => {
        console.log('=== Method 2 - Processing Member ===');
        console.log('Member object:', JSON.stringify(member, null, 2));
        console.log('Member ID:', member.id);
        console.log('Comparing with userId:', userId);
        console.log('Match result:', member.id === userId);
        console.log('=== End Method 2 Processing ===');
        return member.id === userId;
      });
      
      console.log('Is Member (Method 2):', isMember);
      
      return {
        isMember,
        userDetails: {
          id: userId,
          email: email
        }
      };
    }
    
    // Method 3: Direct check using checkMemberGroups endpoint
    console.log('Method 2 failed, trying Method 3...');
    try {
      const checkResponse = await axios.post(
        `${GRAPH_API_BASE}/users/${userId}/checkMemberGroups`,
        {
          groupIds: [GROUP_ID]
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('=== Check Member Groups Response ===');
      console.log('Response:', JSON.stringify(checkResponse.data, null, 2));
      
      const isMember = checkResponse.data.value && checkResponse.data.value.includes(GROUP_ID);
      
      console.log('Is Member (Method 3):', isMember);
      
      return {
        isMember,
        userDetails: {
          id: userId,
          email: email
        }
      };
    } catch (checkError) {
      console.log('Method 3 failed:', checkError.message);
      throw checkError;
    }
  } catch (error) {
    console.log('=== Error in checkGroupMembership ===');
    console.log('Error details:', error.message);
    console.log('Error response:', error.response?.data);
    console.log('Error status:', error.response?.status);
    console.log('===============================');
    
    if (error.response?.status === 404) {
      return {
        isMember: false,
        userDetails: null,
        error: 'User not found or not a member of the group'
      };
    }
    throw error;
  }
}

// API endpoint to check authorization
app.post('/api/checkAuthorization', async (req, res) => {
  console.log('=== API Call Received ===');
  console.log('Request body:', req.body);
  console.log('Email received:', req.body.email);
  console.log('========================');
  
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Get access token
    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('Access token received successfully');

    // Check group membership
    console.log('Checking group membership for email:', email);
    const result = await checkGroupMembership(email, accessToken);

    res.json({
      success: true,
      isAuthorized: result.isMember,
      userDetails: result.userDetails,
      message: result.isMember 
        ? 'User is authorized and is a member of the group'
        : 'User is not authorized or not a member of the group'
    });

  } catch (error) {
    console.error('Error checking authorization:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Temporary endpoint to list users (for debugging)
app.get('/api/users', async (req, res) => {
  try {
    console.log('Getting access token for users list...');
    const accessToken = await getAccessToken();
    
    const response = await axios.get(`${GRAPH_API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        $select: 'id,mail,userPrincipalName,displayName',
        $top: 10
      }
    });
    
    console.log('Users found:', response.data.value.length);
    res.json({
      success: true,
      users: response.data.value,
      count: response.data.value.length
    });
  } catch (error) {
    console.error('Error getting users:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error getting users',
      error: error.response?.data || error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 