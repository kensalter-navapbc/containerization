using Microsoft.AspNetCore.Mvc;

namespace FrontEnd.Controllers;

[ApiController]
[Route("{*catchAll}")]
public class ApiProxyController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApiProxyController> _logger;

    public ApiProxyController(HttpClient httpClient, IConfiguration configuration, ILogger<ApiProxyController> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet]
    [HttpPost]
    [HttpPut]
    [HttpDelete]
    [HttpPatch]
    [HttpOptions]
    [HttpHead]
    public async Task<IActionResult> ProxyRequest(string catchAll)
    {
        try
        {
            var backendUrl = _configuration["BackendApiUrl"] ?? "http://localhost:5237";
            var targetUrl = $"{backendUrl}/{catchAll}";
            
            // Include query string if present
            if (Request.QueryString.HasValue)
            {
                targetUrl += Request.QueryString.Value;
            }

            _logger.LogInformation("Proxying {Method} request to: {TargetUrl}", Request.Method, targetUrl);

            // Create the request message
            var requestMessage = new HttpRequestMessage(new HttpMethod(Request.Method), targetUrl);

            // Copy headers (excluding some that should not be forwarded)
            foreach (var header in Request.Headers)
            {
                if (!ShouldSkipHeader(header.Key))
                {
                    requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                }
            }

            // Copy content for methods that support it
            if (Request.Method != "GET" && Request.Method != "HEAD" && Request.Method != "DELETE" && Request.Method != "OPTIONS")
            {
                if (Request.ContentLength > 0)
                {
                    requestMessage.Content = new StreamContent(Request.Body);
                    
                    if (Request.ContentType != null)
                    {
                        requestMessage.Content.Headers.TryAddWithoutValidation("Content-Type", Request.ContentType);
                    }
                }
            }

            // Send the request
            var response = await _httpClient.SendAsync(requestMessage);

            // Copy response headers (excluding problematic ones)
            foreach (var header in response.Headers)
            {
                if (!ShouldSkipResponseHeader(header.Key))
                {
                    Response.Headers.TryAdd(header.Key, header.Value.ToArray());
                }
            }

            foreach (var header in response.Content.Headers)
            {
                if (!ShouldSkipResponseHeader(header.Key))
                {
                    Response.Headers.TryAdd(header.Key, header.Value.ToArray());
                }
            }

            // Copy response content
            var content = await response.Content.ReadAsStringAsync();
            
            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                Content = content,
                ContentType = response.Content.Headers.ContentType?.ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error proxying request to backend API");
            return StatusCode(500, new { error = "Failed to proxy request to backend API", details = ex.Message });
        }
    }

    private static bool ShouldSkipHeader(string headerName)
    {
        // Skip headers that should not be forwarded
        var headersToSkip = new[]
        {
            "host",
            "connection",
            "transfer-encoding",
            "upgrade",
            "proxy-connection",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailers"
        };

        return headersToSkip.Contains(headerName.ToLowerInvariant());
    }

    private static bool ShouldSkipResponseHeader(string headerName)
    {
        // Skip headers that ASP.NET Core will set automatically or that cause conflicts
        var headersToSkip = new[]
        {
            "transfer-encoding",
            "content-length",
            "connection",
            "upgrade",
            "server",
            "date"
        };

        return headersToSkip.Contains(headerName.ToLowerInvariant());
    }
}