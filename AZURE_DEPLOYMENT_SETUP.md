# Azure Deployment Setup Guide

This guide will help you set up GitHub Actions to deploy your Weather App to Azure Container Apps.

## Prerequisites

1. **Azure Subscription** - You need an active Azure subscription
2. **Azure CLI** - For local testing (optional)
3. **GitHub Repository** - This repository with the workflow file

## 🔧 GitHub Secrets Setup

You need to configure these secrets in your GitHub repository:

### 1. Azure Service Principal Credentials

First, create an Azure Service Principal and get the credentials:

```bash
# Login to Azure
az login

# Get your subscription ID
az account show --query id -o tsv

# Create service principal (replace SUBSCRIPTION_ID with your actual subscription ID)
az ad sp create-for-rbac \
  --name "weatherapp-github-actions" \
  --role "Contributor" \
  --scopes "/subscriptions/SUBSCRIPTION_ID" \
  --sdk-auth
```

This will output JSON like:
```json
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### 2. Add GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret:

**Required Secrets:**

1. **`AZURE_CREDENTIALS`**
   - Value: The entire JSON output from the service principal creation command above

2. **`SQL_SA_PASSWORD`**
   - Value: Your SQL Server SA password (e.g., `$kT_v6CGfUTIY*LB`)
   - This will be used for the containerized SQL Server database

## 🚀 Deployment Process

### Manual Deployment (Current Setup)

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to Azure Container Apps" workflow
4. Click "Run workflow"
5. Choose environment (production/staging)
6. Click "Run workflow"

The deployment will:
1. ✅ Create Azure Resource Group (`weatherapp-rg`)
2. ✅ Create Azure Container Registry (`weatherappregistry`)
3. ✅ Build and push Docker images for all services
4. ✅ Create Container Apps Environment (`weatherapp-env`)
5. ✅ Deploy Database Container App (`weatherapp-database`)
6. ✅ Deploy Backend Container App (`weatherapp-backend`)
7. ✅ Deploy Frontend Container App (`weatherapp-frontend`)
8. ✅ Configure networking and environment variables

### Automatic Deployment (Future Setup)

To enable automatic deployment on every push to `main` branch:

1. Open `.github/workflows/deploy-to-azure.yml`
2. Comment out the current `on:` section:
   ```yaml
   # on:
   #   workflow_dispatch:
   #     inputs:
   #       environment:
   #         description: 'Environment to deploy to'
   #         required: true
   #         default: 'production'
   #         type: choice
   #         options:
   #           - production
   #           - staging
   ```

3. Uncomment the automatic trigger section:
   ```yaml
   on:
     push:
       branches: [ main ]
       paths-ignore:
         - '*.md'
         - 'docs/**'
     workflow_dispatch:  # Keep manual option too
   ```

## 🏗️ Azure Resources Created

The deployment creates these Azure resources:

### Resource Group: `weatherapp-rg`
- **Location:** East US
- **Contains:** All application resources

### Container Registry: `weatherappregistry`
- **Purpose:** Store Docker images
- **Access:** Admin enabled for GitHub Actions

### Container Apps Environment: `weatherapp-env`
- **Purpose:** Shared environment for all container apps
- **Features:** Automatic scaling, networking, monitoring

### Container Apps:

1. **weatherapp-database**
   - **Image:** SQL Server (Azure SQL Edge)
   - **Networking:** Internal only
   - **Resources:** 1 CPU, 2GB RAM
   - **Replicas:** 1 (fixed)

2. **weatherapp-backend**
   - **Image:** .NET 8 Web API
   - **Networking:** External (HTTPS)
   - **Resources:** 0.5 CPU, 1GB RAM
   - **Replicas:** 1-3 (auto-scaling)
   - **Features:** JWT authentication, Swagger UI

3. **weatherapp-frontend**
   - **Image:** ASP.NET Core hosting Angular
   - **Networking:** External (HTTPS)
   - **Resources:** 0.5 CPU, 1GB RAM
   - **Replicas:** 1-3 (auto-scaling)

## 🔗 Service Communication

The services communicate as follows:

```
Internet → Frontend (HTTPS) → Backend (HTTPS) → Database (Internal)
```

- **Frontend:** Public-facing Angular application
- **Backend:** API endpoints with authentication
- **Database:** Internal SQL Server (not accessible from internet)

## 🌐 Access Your Application

After deployment, you'll get URLs like:

- **Frontend:** `https://weatherapp-frontend.kindwater-12345.eastus.azurecontainerapps.io`
- **Backend API:** `https://weatherapp-backend.kindwater-12345.eastus.azurecontainerapps.io`
- **Backend Swagger:** `https://weatherapp-backend.kindwater-12345.eastus.azurecontainerapps.io/swagger`

## 💰 Cost Estimation

**Monthly Azure costs (approximate):**
- Container Apps Environment: ~$0 (consumption-based)
- Container Registry: ~$5/month (Basic tier)
- Container Apps (3 apps): ~$20-60/month (depending on usage)
- **Total: ~$25-65/month**

*Note: Costs vary based on actual usage, scaling, and Azure region*

## 🛠️ Troubleshooting

### Common Issues:

1. **Service Principal Permission Issues**
   ```bash
   # Add additional permissions if needed
   az role assignment create \
     --assignee SERVICE_PRINCIPAL_ID \
     --role "AcrPush" \
     --scope "/subscriptions/SUBSCRIPTION_ID"
   ```

2. **Container Start Issues**
   ```bash
   # View container logs
   az containerapp logs show \
     --name weatherapp-backend \
     --resource-group weatherapp-rg
   ```

3. **Database Connection Issues**
   - Check if SQL_SA_PASSWORD secret is set correctly
   - Verify database container is running and healthy

### Monitoring and Logs

```bash
# View application insights
az monitor app-insights component show \
  --resource-group weatherapp-rg

# Stream logs in real-time
az containerapp logs show \
  --name weatherapp-backend \
  --resource-group weatherapp-rg \
  --follow
```

## 🔄 Updates and Redeployment

To update your application:
1. Push changes to your repository
2. Run the GitHub Action again (manual) or push to main (automatic)
3. The workflow will rebuild and redeploy only changed components

## 🗑️ Cleanup

To remove all Azure resources:

```bash
# Delete the entire resource group (removes everything)
az group delete --name weatherapp-rg --yes --no-wait
```

## 📞 Support

If you encounter issues:
1. Check the GitHub Actions logs for detailed error messages
2. Use Azure Portal to monitor resource health
3. Review container logs using Azure CLI or portal