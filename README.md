# Gadget Deploy

A web application for deploying MediaWiki gadgets to Wikimedia wikis using OAuth authentication and real-time streaming of deployment status.

### Configuring gadgets for deployment

Currently supported gadgets:

- **Twinkle**: https://github.com/wikimedia-gadgets/twinkle
- **AfC Helper**: https://github.com/wikimedia-gadgets/afc-helper

Steps to add a new gadget:
1. Add an entry in `gadget-conf.ts`:
```typescript
export const gadgetConfigurations = {
    'new-gadget': {
        name: 'New Gadget',
        branch: 'main',
        branchUrl: 'https://github.com/user/repo/commits/main',
        instructions: [],
        credentialsFilePath: 'scripts/credentials.json',
        buildCommand: '', // Optional
        deployCommand: 'npm run deploy',
        wikis: ['testwiki', 'enwiki']
    },
    // ... existing gadgets
}
```
The gadget must have a deployment script that does not prompt for any user input. It should accept an OAuth access token from the `credentialsFilePath`, which is written by this tool in this format:

```json
{
   "site": "", // API url of the wiki, eg. https://en.wikipedia.org/w/api.php
   "accessToken": "" // OAuth 2 access token
}
```

2. Clone the gadget's git repo on the Toolforge project:
```bash
ssh toolforge
become gadget-deploy
cd ~/www/js/repos
git clone https://github.com/user/gadget-123.git gadget-123 
```

The key used in gadget-conf.ts should match the name of the cloned directory.

### Project structure

```
gadget-deploy/
├── client/                 # React-based frontend for initiating deployments
├── server/                 # Node.js backend using Express.js
├── repos/                  # Gadget repositories (git-ignored)
│   ├── twinkle/
│   ├── afc-helper/
│   └── (other gadgets) 
├── gadget-conf.ts          # Gadget and wiki configurations
└── package.json            # Root package.json
```

### Setting up and testing locally 

### 1. Prerequisites

- Node.js 22+
- A local MediaWiki instance (for testing), with Extension:OAuth installed.

Install dependencies:

```bash
npm install
```

### 2. Configuration

Create `server/conf.ts` by copying the template configuration file:

```bash
cp server/conf.template.ts server/conf.ts
```

Edit it with your OAuth credentials and settings:

```typescript
export default {
    // REST API url of the central wiki (metawiki for Wikimedia cluster)
    restApiUrl: 'http://localhost:4000/rest.php',
   
    // The frontend url of the project (https://gadget-deploy.toolforge.org in production)
    redirectUrl: 'http://localhost:3000',
    
    // OAuth consumer credentials 
    clientId: 'your_oauth_client_id',
    clientSecret: 'your_oauth_client_secret',
};
```

#### Client configuration

The client is configured to use the current domain for the backend URL. If you need to change this, edit `client/src/consts.ts`:

```typescript
export const BACKEND_URL = 'http://localhost:3001'; // or your backend URL
```

### 3. OAuth consumer registration

To test locally, you'll need to register an OAuth consumer in your MediaWiki instance:

1. **Install [OAuth extension](https://www.mediawiki.org/wiki/Extension:OAuth)** in your MediaWiki instance
2. **Create a new OAuth consumer**:
   - Go to `Special:OAuthConsumerRegistration`
   - Set redirect URL to: `http://localhost:3000`
   - Ignore the warning about redirect URL not having a path 
   - Note down the `client_id` and `client_secret`
3. **Update your `server/conf.ts`** with the credentials

### 4. Clone gadget repositories

The deployment system expects gadget repositories in the `repos/` directory:

```bash
cd repos

# Clone Twinkle (or any other gadget you want to deploy)
git clone https://github.com/wikimedia-gadgets/twinkle.git
```

You could also just create a symlink to your local repository of the gadget.

### 5. Build

```bash
# Build both client and server
npm run build

# Or build individually:
npm run build:client
npm run build:server
```

## Run

### Development mode

```bash
# Start the server in development mode
cd server
npm run dev

# In another terminal, start the client
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

The `PORT` environment variable can be used to configure the ports on which client and server run. The client connects to the server using the VITE_BACKEND_URL configured in `.env.development` file.

### Production mode

```bash
# Build the project first
npm run build

# Start the server
npm start
```

In production mode, the application will be available at http://localhost:3000. The client does **not** run separately. Instead, the build artefacts are served statically by the server.

## Usage

1. **Access the application** at http://localhost:3000
2. **Select a gadget** from the available options (Twinkle, AfC Helper)
3. **Choose a target wiki** (testwiki, enwiki, or localhost)
4. **Authenticate** using OAuth
5. **Monitor the deployment** in real-time through the streaming interface


## Troubleshooting

### Common issues

1. **OAuth authentication fails**
   - Verify your `client_id` and `client_secret` in `server/conf.ts`
   - Ensure the callback URL matches your OAuth consumer registration

2. **Deployment fails**
   - Check that the gadget repository exists in `repos/`
   - Check that gadget repository does not have any uncommitted changes
   - Verify the gadget has the required deployment scripts
   - Check the real-time logs in the web interface

3. **Build errors**
   - Ensure all dependencies are installed
   - Check TypeScript compilation errors
   - Verify Node.js version compatibility

### Logs

Server logs are available in the console where you started the server. The application uses [Winston](https://npmjs.com/package/winston) for structured logging.
