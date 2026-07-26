using Microsoft.AspNetCore.Authorization;
using AyalasLanguageAPI.DTOs;
using System.Text.Json;
using System.Text;
using System.Net.Http.Headers;

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
        HttpClient httpClient)
    {
        var apiKey = config["Puter:APIKey"];
        if (string.IsNullOrEmpty(apiKey)) return Results.Problem("Puter API Key not configured.");

        var puterPayload = new
        {
            text = request.Text,
            options = new
            {
                provider = request.Provider,
                voice = request.Voice,
                engine = request.Engine ?? "neural",
                language = request.Language ?? "en-US",
                ssml = request.Ssml,
                test_mode = false
            }
        };

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, config["Puter:TextToSpeechEndpoint"]);
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpRequest.Content = new StringContent(JsonSerializer.Serialize(puterPayload), Encoding.UTF8, "application/json");

        var response = await httpClient.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return Results.Problem($"Puter TTS Error: {error}");
        }

        var stream = await response.Content.ReadAsStreamAsync();
        // Returns the audio stream directly to the mobile app
        return Results.Stream(stream, "audio/mpeg");
    }

    private static async Task<IResult> ProxyChat(
        PuterChatRequestDto request, 
        IConfiguration config, 
        HttpClient httpClient)
    {
        var apiKey = config["Puter:APIKey"];
        if (string.IsNullOrEmpty(apiKey)) return Results.Problem("Puter API Key not configured.");

        var puterPayload = new
        {
            messages = request.Messages,
            model = request.Model,
            stream = false
        };

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, config["Puter:AICHatEndpoint"]);
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpRequest.Content = new StringContent(JsonSerializer.Serialize(puterPayload), Encoding.UTF8, "application/json");

        var response = await httpClient.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return Results.Problem($"Puter Chat Error: {error}");
        }

        // We return the exact JSON structure Puter returns so the 
        // client-side 'response.message.content' logic remains compatible.
        var jsonResponse = await response.Content.ReadAsStringAsync();
        return Results.Content(jsonResponse, "application/json");
    }
}