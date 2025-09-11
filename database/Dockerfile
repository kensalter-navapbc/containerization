# Use Azure SQL Edge for ARM compatibility
FROM mcr.microsoft.com/azure-sql-edge:latest

# Set environment variables
ENV ACCEPT_EULA=1
ENV MSSQL_SA_PASSWORD=YourStrong!Passw0rd
ENV MSSQL_PID=Developer

# Switch to root to create directories and copy scripts
USER root

# Install dos2unix to handle line ending issues
RUN apt-get update && apt-get install -y dos2unix && rm -rf /var/lib/apt/lists/*

# Create directories for scripts (don't touch data directories)
RUN mkdir -p /opt/mssql-scripts

# Copy SQL scripts and entrypoint
COPY scripts/*.sql /opt/mssql-scripts/
COPY entrypoint.sh /opt/mssql-scripts/

# Fix line endings and make script executable for all users
RUN dos2unix /opt/mssql-scripts/entrypoint.sh && \
    chmod 755 /opt/mssql-scripts/entrypoint.sh && \
    chmod 644 /opt/mssql-scripts/*.sql

# Switch back to mssql user
USER mssql

# Expose port
EXPOSE 1433

# Use custom entrypoint
CMD ["/bin/bash", "/opt/mssql-scripts/entrypoint.sh"]