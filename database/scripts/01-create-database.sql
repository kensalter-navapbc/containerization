-- Create the WeatherApp database
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'WeatherApp')
BEGIN
    CREATE DATABASE WeatherApp;
END
GO

USE WeatherApp;
GO


PRINT 'Database created successfully.';