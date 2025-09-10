FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install .NET 8 SDK
RUN wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y dotnet-sdk-8.0

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Angular CLI globally
RUN npm install -g @angular/cli@17

# Install additional development tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    tree \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Install SQL Server tools for connecting to the database
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/msprod.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y mssql-tools18 unixodbc-dev \
    && echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> /home/vscode/.bashrc \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /workspace

# Create vscode user for better compatibility
RUN if ! id -u vscode > /dev/null 2>&1; then \
        groupadd --gid 1000 vscode \
        && useradd --uid 1000 --gid vscode --shell /bin/bash --create-home vscode; \
    fi

# Give vscode user ownership of workspace
RUN chown -R vscode:vscode /workspace

USER vscode