CREATE TABLE [dbo].[WeatherForecast] (
    [Id]           INT            IDENTITY (1, 1) NOT NULL,
    [Date]         DATE           NOT NULL,
    [TemperatureC] INT            NOT NULL,
    [TemperatureF] INT            NOT NULL,
    [Summary]      NVARCHAR (100) NOT NULL,
    [CreatedAt]    DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    [UpdatedAt]    DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_WeatherForecast_Date]
    ON [dbo].[WeatherForecast]([Date] ASC);


GO

