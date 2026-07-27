using Microsoft.AspNetCore.Authorization;
using AyalasLanguageAPI.DTOs;
using System.Text.Json;
using System.Text;
using System.Net.Http.Headers;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageAPI.Data.Logging;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Logic;

namespace AyalasLanguageAPI.Endpoints.Puter;

public static class PuterEndpoints
{
    public static void MapPuterEndpoints(this IEndpointRouteBuilder app)
    {
        var puterGroup = app.MapGroup("/api/puter")
                .AddEndpointFilter<ErrorLoggingFilter>()
                .WithTags("Puter")
                .RequireAuthorization(new AuthorizeAttribute
                {
                    AuthenticationSchemes = "PublicAuth"
                });

        puterGroup.MapPost("/tts", ProxyTextToSpeech);
        puterGroup.MapPost("/chat", ProxyChat);
    }

    private static async Task<IResult> ProxyTextToSpeech(
        PuterTtsRequestDto request, 
        IConfiguration config, 
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();
        var apiKey = config["Puter:APIKey"];
        if (string.IsNullOrEmpty(apiKey)) return Results.Problem("Puter API Key not configured.");

        var puterPayload = new
        {
            @interface = "puter-tts", 
            driver = request.Provider,
            test_mode = false,
            method = "synthesize",
            auth_token = apiKey,
            args = new
            {
                engine = request.Engine ?? "neural",
                language = request.Language ?? "en-US",
                provider = request.Provider,
                ssml = request.Ssml,
                test_mode = false,
                text = request.Text,
                voice = request.Voice
            }
        };
        var endpoint = config["Puter:TextToSpeechEndpoint"];
        var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint);
        
        httpRequest.Content = new StringContent(JsonSerializer.Serialize(puterPayload), Encoding.UTF8, "application/json");
        logger.LogInformation("initiating TTS request to puter endpoint {endpoint}", endpoint);
        var response = await httpClient.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            var logData = new PuterEndpointFailure
                    {
                        Error = error,
                        RequestData = System.Text.Json.JsonSerializer.Serialize(request),
                        Endpoint = endpoint ?? ""
                    };
            logger.LogError("Puter TTS Error: {error}. {request}. {endpoint}", error, logData.RequestData, endpoint);
            await db.CreateLogInternal(userId, LogTypeEnum.PuterTTSFailure, logData);
            return Results.Problem($"Puter TTS Error: {error}");
        }

        var stream = await response.Content.ReadAsStreamAsync();
        // Returns the audio stream directly to the mobile app
        return Results.Stream(stream, "audio/mpeg");
    }

    private static async Task<IResult> ProxyChat(
        PuterChatRequestDto request, 
        IConfiguration config, 
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();
        var apiKey = config["Puter:APIKey"];
        if (string.IsNullOrEmpty(apiKey)) return Results.Problem("Puter API Key not configured.");

        var puterPayload = new
        {
            @interface = "puter-chat-completion",
            driver = "ai-chat",
            method= "complete",
            auth_token = apiKey,
            test_mode = false,
            args = new {
                messages = request.Messages
            }
        };
        var endpoint = config["Puter:AICHatEndpoint"];
        var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(puterPayload), Encoding.UTF8, "application/json")
        };
        logger.LogInformation("initiating Chat request to puter endpoint {endpoint}", endpoint);
        var response = await httpClient.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            var logData = new PuterEndpointFailure
            {
                Error = error,
                RequestData = System.Text.Json.JsonSerializer.Serialize(request),
                Endpoint = endpoint ?? ""
            };

            logger.LogError("Puter Chat Error: {error}. {request}. {endpoint}", error, logData.RequestData, endpoint);
            await db.CreateLogInternal(userId, LogTypeEnum.PuterChatFailure, logData);
            return Results.Problem($"Puter Chat Error: {error}");
        }

        // We return the exact JSON structure Puter returns so the 
        // client-side 'response.message.content' logic remains compatible.
        var jsonResponse = await response.Content.ReadAsStringAsync();
        return Results.Content(jsonResponse, "application/json");
    }
}