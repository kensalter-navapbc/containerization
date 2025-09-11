-- Verify the database setup and data
USE WeatherApp;
GO

-- Check database exists
SELECT 
    name as DatabaseName,
    database_id,
    create_date,
    collation_name
FROM sys.databases 
WHERE name = 'WeatherApp';
GO

-- Check table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'WeatherForecast'
ORDER BY ORDINAL_POSITION;
GO

-- Check total record count
SELECT COUNT(*) as TotalRecords 
FROM WeatherForecast;
GO

-- Show date range of data
SELECT 
    MIN([Date]) as EarliestDate,
    MAX([Date]) as LatestDate,
    COUNT(*) as TotalDays
FROM WeatherForecast;
GO

-- Show temperature statistics
SELECT 
    MIN(TemperatureC) as MinTempC,
    MAX(TemperatureC) as MaxTempC,
    AVG(TemperatureC) as AvgTempC,
    MIN(TemperatureF) as MinTempF,
    MAX(TemperatureF) as MaxTempF,
    AVG(TemperatureF) as AvgTempF
FROM WeatherForecast;
GO

-- Show unique weather summaries
SELECT 
    Summary,
    COUNT(*) as Count
FROM WeatherForecast
GROUP BY Summary
ORDER BY COUNT(*) DESC;
GO

-- Show recent weather data (next 7 days)
SELECT TOP 7
    [Date],
    TemperatureC,
    TemperatureF,
    Summary
FROM WeatherForecast 
WHERE [Date] >= CAST(GETDATE() AS date)
ORDER BY [Date];
GO

-- Show sample of historical data
SELECT TOP 5
    [Date],
    TemperatureC,
    TemperatureF,
    Summary
FROM WeatherForecast 
WHERE [Date] < CAST(GETDATE() AS date)
ORDER BY [Date] DESC;
GO

PRINT 'Database verification completed successfully.';