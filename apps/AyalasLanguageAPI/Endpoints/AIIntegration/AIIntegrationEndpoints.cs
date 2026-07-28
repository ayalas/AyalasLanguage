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
using OpenAI.Chat;
using OpenAI;
using System.ClientModel;
using OpenAI.Audio;
using System.ClientModel.Primitives;

namespace AyalasLanguageAPI.Endpoints.AIIntegration;

public static class AIIntegrationEndpoints
{
    public static void MapAIIntegrationEndpoints(this IEndpointRouteBuilder app)
    {
        var aiGroup = app.MapGroup("/api/ai")
                .AddEndpointFilter<ErrorLoggingFilter>()
                .WithTags("ai")
                .RequireAuthorization(new AuthorizeAttribute
                {
                    AuthenticationSchemes = "PublicAuth"
                });

        var puterGroup = aiGroup.MapGroup("/puter").WithTags("puter");
        puterGroup.MapPost("/tts", PuterTextToSpeech);
        puterGroup.MapPost("/chat", PuterChat);

        var uncloseGroup = aiGroup.MapGroup("/unclose").WithTags("unclose");
        uncloseGroup.MapPost("/tts", UncloseAITextToSpeech);
        uncloseGroup.MapPost("/chat", UncloseAIChat);

        var openAIEgdeTTS = aiGroup.MapGroup("/edge").WithTags("edge");
        openAIEgdeTTS.MapPost("/tts", OpenAIEdgeTTS);
    }

    private static async Task<IResult> UncloseAITextToSpeech(
        AITtsRequestDto request,
        IConfiguration config,
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();
        var endpoint = config["AI:TTSEndpoint"];
        var apiKey = config["AI:TTSAPIKey"];
        var model = config["AI:TTSModel"];
        if (string.IsNullOrEmpty(apiKey)) return Results.Problem("AI TTS API Key not configured.");
        if (string.IsNullOrEmpty(endpoint)) return Results.Problem("AI TTS endpoint not configured.");
        if (string.IsNullOrEmpty(model)) return Results.Problem("AI TTS model not configured.");

        var client = new AudioClient(
            model: model,
            credential: new ApiKeyCredential(apiKey),
            new OpenAIClientOptions
            {
                Endpoint = new Uri(endpoint)
            }
        );

        string[] supportedVoices = [
            "aria","clara","elena","grace","hazel","iris","luna","maya","ruby","sage","sofia","amber","brooke","cora",
            "diana","eden","faye","gemma","hope","ivy","atlas","caleb","felix","hugo","jasper","kai","leo","marcus","owen","theo","archer",
            "blake","cole","dane","ezra","finn","grant","heath","ivan","jude","foxhop"];
        
        string voice = supportedVoices.Contains(request.Voice) ? request.Voice : "elena";

        try
        {
            BinaryData speech = await client.GenerateSpeechAsync(
                request.Text,
                new GeneratedSpeechVoice(voice),
                new SpeechGenerationOptions
                {
                    ResponseFormat = GeneratedSpeechFormat.Mp3,
                    SpeedRatio = 1.0f
                }
            );

            return Results.Stream(speech.ToStream(), "audio/mpeg");
        }
        catch (ClientResultException ex)
        {
            PipelineResponse? response = ex.GetRawResponse();
            string? detailedError = response?.Content?.ToString() ?? ex.Message;

            var logData = new AIEndpointFailure
            {
                Error = detailedError,
                RequestData = System.Text.Json.JsonSerializer.Serialize(request),
                Endpoint = endpoint ?? "",
                Model = model
            };
            logger.LogError(ex, "AI TTS Error: {request}. {endpoint}: {detailedError}", logData.RequestData, endpoint, detailedError);
            await db.CreateLogInternal(userId, LogTypeEnum.AITTSFailure, logData);
            return Results.Problem($"AI TTS Error: {detailedError}");
        }
    }

    private static async Task<IResult> UncloseAIChat(
        AIChatRequestDto request,
        IConfiguration config,
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();
        var endpoint = config["AI:ChatEndpoint"];
        var model = config["AI:ChatModel"];
        var apiKey = config["AI:ChatAPIKey"];
        if (string.IsNullOrEmpty(apiKey)) return Results.Problem("AI Chat API Key not configured.");
        if (string.IsNullOrEmpty(endpoint)) return Results.Problem("AI Chat endpoint not configured.");
        if (string.IsNullOrEmpty(model)) return Results.Problem("AI Chat model not configured.");

        var client = new ChatClient(
            model: model,
            credential: new ApiKeyCredential(apiKey),
            new OpenAIClientOptions
            {
                Endpoint = new Uri(endpoint)
            });

        var msgList = new List<ChatMessage>();
        foreach (AIChatMessageDto msg in request.Messages)
        {
            switch (msg.role)
            {
                case "system":
                    msgList.Add(new SystemChatMessage(msg.content));
                    break;
                case "user":
                    msgList.Add(new UserChatMessage(msg.content));
                    break;
            }
        }

        string schemaJson = """
            {
            "type": "object",
            "properties": {
                "content": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                    "First": { "type": "string" },
                    "Second": { "type": "string" },
                    "Translation": { "type": ["string", "null"] },
                    "ExtraOptions": { "type": ["string", "null"] }
                    },
                    "required": ["First", "Second", "Translation", "ExtraOptions"],
                    "additionalProperties": false
                }
                }
            },
            "required": ["content"],
            "additionalProperties": false
            }
            """;
        try
        {
            ChatCompletion completion = await client.CompleteChatAsync(
                msgList,
                new ChatCompletionOptions
                {
                    Temperature = 0.5f,
                    ResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat(
                        jsonSchemaFormatName: "translation_list",
                        jsonSchema: BinaryData.FromString(schemaJson),
                        jsonSchemaIsStrict: true
                    )
                }
            );

            string rawJson = completion.Content[0].Text;

            /*  var logInfoData = new AIEndpointInfo
            {
                RequestData = System.Text.Json.JsonSerializer.Serialize(request),
                Endpoint = endpoint ?? "",
                Model = model ?? "",
                ResponseData = rawJson
            };

            await db.CreateLogInternal(userId, LogTypeEnum.AIChatInfo, logInfoData); */

            return Results.Content(rawJson, "application/json");
        }
        catch (ClientResultException ex)
        {
            PipelineResponse? response = ex.GetRawResponse();
            string? detailedError = response?.Content?.ToString() ?? ex.Message;

            var logData = new AIEndpointFailure
            {
                Error = detailedError,
                RequestData = System.Text.Json.JsonSerializer.Serialize(request),
                Endpoint = endpoint ?? "",
                Model = model ?? ""
            };
            logger.LogError(ex, "AI Chat Error:{request}. {endpoint}: {detailedError}", logData.RequestData, endpoint, detailedError);
            await db.CreateLogInternal(userId, LogTypeEnum.AIChatFailure, logData);
            return Results.Problem($"AI Chat Error: {detailedError}");
        }
    }

    private static async Task<IResult> OpenAIEdgeTTS(
        AITtsRequestDto request,
        IConfiguration config,
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        return await ProxyTextToSpeech(request, config, httpClient, claim, db, logger, (req, apiKey) =>
        {
            return new
            {
                model = "tts-1",
                voice = req.Voice,
                input = req.Text
            };
        });
    }

    private static async Task<IResult> PuterTextToSpeech(
        AITtsRequestDto request,
        IConfiguration config,
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        return await ProxyTextToSpeech(request, config, httpClient, claim, db, logger, (req, apiKey) =>
        {
            return new
            {
                @interface = "puter-tts",
                driver = req.Provider,
                test_mode = false,
                method = "synthesize",
                auth_token = apiKey,
                args = new
                {
                    engine = req.Engine ?? "neural",
                    language = req.Language ?? "en-US",
                    provider = req.Provider,
                    ssml = req.Ssml,
                    test_mode = false,
                    text = req.Text,
                    voice = req.Voice
                }
            };
        });
    }

    private static async Task<IResult> PuterChat(
        AIChatRequestDto request,
        IConfiguration config,
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        return await ProxyChat(request, config, httpClient, claim, db, logger, (req, apiKey) =>
        {
            return new
            {
                @interface = "puter-chat-completion",
                driver = "ai-chat",
                method = "complete",
                auth_token = apiKey,
                test_mode = false,
                args = new
                {
                    messages = req.Messages
                }
            };
        });
    }

    internal static async Task<IResult> ProxyTextToSpeech<TResponse>(
        AITtsRequestDto request,
        IConfiguration config,
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger, Func<AITtsRequestDto, string, TResponse> getPayloadCallback)
    {
        var userId = claim.GetUserId();
        var endpoint = config["AI:TTSEndpoint"];
        var apiKey = config["AI:TTSAPIKey"];
        if (string.IsNullOrEmpty(apiKey)) return Results.Problem("AI TTS API Key not configured.");

        var aiRequestPayload = getPayloadCallback(request, apiKey);

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(aiRequestPayload), Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        logger.LogInformation("initiating TTS request to ai endpoint {endpoint}", endpoint);
        var response = await httpClient.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            var logData = new AIEndpointFailure
            {
                Error = error,
                RequestData = System.Text.Json.JsonSerializer.Serialize(request),
                Endpoint = endpoint ?? ""
            };
            logger.LogError("AI TTS Error: {error}. {request}. {endpoint}", error, logData.RequestData, endpoint);
            await db.CreateLogInternal(userId, LogTypeEnum.AITTSFailure, logData);
            return Results.Problem($"AI TTS Error: {error}");
        }

        var stream = await response.Content.ReadAsStreamAsync();
        // Returns the audio stream directly to the mobile app
        return Results.Stream(stream, "audio/mpeg");
    }

    internal static async Task<IResult> ProxyChat<TResponse>(
        AIChatRequestDto request,
        IConfiguration config,
        HttpClient httpClient, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger, Func<AIChatRequestDto, string, TResponse> getPayloadCallback)
    {
        var userId = claim.GetUserId();
        var endpoint = config["AI:ChatEndpoint"];
        var apiKey = config["AI:ChatAPIKey"];
        if (string.IsNullOrEmpty(apiKey)) return Results.Problem("AI Chat API Key not configured.");

        var puterPayload = getPayloadCallback(request, apiKey);

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(puterPayload), Encoding.UTF8, "application/json")
        };
        logger.LogInformation("initiating Chat request to ai endpoint {endpoint}", endpoint);
        var response = await httpClient.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            var logData = new AIEndpointFailure
            {
                Error = error,
                RequestData = System.Text.Json.JsonSerializer.Serialize(request),
                Endpoint = endpoint ?? ""
            };

            logger.LogError("AI Chat Error: {error}. {request}. {endpoint}", error, logData.RequestData, endpoint);
            await db.CreateLogInternal(userId, LogTypeEnum.AIChatFailure, logData);
            return Results.Problem($"AI Chat Error: {error}");
        }

        // We return the exact JSON structure AI returns so the 
        // client-side 'response.message.content' logic remains compatible.
        var jsonResponse = await response.Content.ReadAsStringAsync();
        return Results.Content(jsonResponse, "application/json");
    }


}