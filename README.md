# Microsoft Graph API Group Membership Checker

A ReactJS application with Node.js backend that uses Microsoft Graph API to check if an email address is a member of a specific Azure AD group.

## Features

- Modern React frontend with beautiful UI
- Node.js/Express backend with Microsoft Graph API integration
- Real-time group membership checking
- User-friendly error handling and validation
- Responsive design for mobile and desktop

## Prerequisites

Before running this application, you need:

1. **Node.js** (version 14 or higher)
2. **Azure AD App Registration** with the following permissions:
   - Microsoft Graph API permissions:
     - `User.Read.All` (to read user information)
     - `GroupMember.Read.All` (to read group memberships)
   - Application permissions (not delegated)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with your Azure AD configuration:

```env
# Microsoft Graph API Configuration
AZURE_CLIENT_ID=your_azure_client_id_here
AZURE_CLIENT_SECRET=your_azure_client_secret_here
AZURE_TENANT_ID=your_azure_tenant_id_here
GROUP_ID=your_group_id_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Azure AD App Registration Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: Graph API Group Checker
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web - `http://localhost:3000`
5. After creation, note down the **Application (client) ID** and **Directory (tenant) ID**
6. Go to **Certificates & secrets** and create a new client secret
7. Go to **API permissions** and add:
   - `User.Read.All` (Application permission)
   - `GroupMember.Read.All` (Application permission)
8. Click **Grant admin consent** for your organization

### 4. Get Group ID

1. In Azure Portal, go to **Azure Active Directory** > **Groups**
2. Find your target group and copy its **Object ID**

### 5. Update Environment Variables

Replace the placeholder values in your `.env` file:
- `AZURE_CLIENT_ID`: Your application client ID
- `AZURE_CLIENT_SECRET`: Your client secret
- `AZURE_TENANT_ID`: Your tenant ID
- `GROUP_ID`: Your group object ID

## Running the Application

### Development Mode

```bash
# Run both frontend and backend concurrently
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Production Mode

```bash
# Build the frontend
npm run build

# Start the backend
npm run server
```

## API Endpoints

### POST /api/checkAuthorization

Check if a user is a member of the specified group.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "isAuthorized": true,
  "userDetails": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "User Name"
  },
  "message": "User is authorized and is a member of the group"
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## Usage

1. Open the application in your browser (http://localhost:3000)
2. Enter an email address in the input field
3. Click "Check Permission"
4. View the result showing whether the user is authorized or not

## Error Handling

The application handles various error scenarios:

- Invalid email format
- User not found in Azure AD
- User not a member of the specified group
- Server configuration errors
- Network connectivity issues

## Security Considerations

- Store sensitive configuration in environment variables
- Use HTTPS in production
- Implement proper authentication and authorization
- Regularly rotate client secrets
- Monitor API usage and implement rate limiting

## Troubleshooting

### Common Issues

1. **"Failed to get access token"**
   - Check your Azure AD app registration permissions
   - Verify client ID, secret, and tenant ID
   - Ensure admin consent is granted

2. **"User not found"**
   - Verify the email exists in your Azure AD tenant
   - Check if the user account is active

3. **"Cannot connect to server"**
   - Ensure the backend server is running
   - Check if port 5000 is available
   - Verify firewall settings

### Debug Mode

Set `NODE_ENV=development` in your `.env` file to see detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 