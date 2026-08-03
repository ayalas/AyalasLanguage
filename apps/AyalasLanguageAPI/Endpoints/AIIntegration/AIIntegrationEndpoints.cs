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
using System.Text.Json.Serialization;

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


        model = await AutoSelectModel(model, endpoint, apiKey, httpClient, logger, db, userId);

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

        List<string> schemaJsonArr =
        [
            $$"""
            {
            "type": "object",
            "properties": {
                "content": {
                "type": "array",
                "minItems": {{request.NumOfExercises}},
                "maxItems": {{request.NumOfExercises}},
                "items": {
                    "type": "object",
                    "properties": {
            """,
        ];

        string requiredFields;

        if (FirstIsArray(request.ExerciseType) && SecondIsArray(request.ExerciseType))
        {
            // Added a comma at the very end of this string block
            schemaJsonArr.Add($$"""
                "Matches": { "type": "array", 
                    "minItems": {{request.Matches}},
                    "maxItems": {{request.Matches}},
                    "items": { "type": "object", 
                            "properties": { 
                                "First": { "type": "string" }, 
                                "Second": { "type": "string" } 
                            }, 
                            "required": ["First", "Second"], 
                    "additionalProperties": false } 
        },
        """);
            // Only these fields exist in this branch
            requiredFields = "\"Matches\", \"Translation\", \"ExtraOptions\"";
        }
        else
        {
            schemaJsonArr.Add("\"First\": { \"type\": \"string\" },");
            schemaJsonArr.Add(SecondIsArray(request.ExerciseType)
                ? "\"Second\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },"
                : "\"Second\": { \"type\": \"string\" },");

            // These fields exist in this branch
            requiredFields = "\"First\", \"Second\", \"Translation\", \"ExtraOptions\"";
        }

        // Use $$ and {{ }} for interpolation in raw string literals (C# 11+)
        schemaJsonArr.Add($$"""
                "Translation": { "type": ["string", "null"] },
                    "ExtraOptions": { 
                        "type": ["array", "null"],
                        "minItems": {{request.ExtraOptions}},
                        "maxItems": {{request.ExtraOptions}},
                        "items": { "type": "string" }
                    }
                },
                "required": [{{requiredFields}}],
                "additionalProperties": false
                }
            }
        },
        "required": ["content"],
        "additionalProperties": false
        }
        """);

        string schemaJson = string.Join("", schemaJsonArr);
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

            string rawJson = TransformToClientJson(completion.Content[0].Text);

            return Results.Content(rawJson, "application/json");
        }
        catch (ClientResultException ex)
        {
            PipelineResponse? response = ex.GetRawResponse();
            string? detailedError = string.IsNullOrEmpty(response?.Content?.ToString()) ? ex.Message : response?.Content?.ToString();
            var logData = new AIEndpointFailure
            {
                Error = detailedError,
                RequestData = System.Text.Json.JsonSerializer.Serialize(request),
                Endpoint = endpoint ?? "",
                Model = model ?? ""
            };
            logger.LogError(ex, "AI Chat Error:{request}. {endpoint}: {detailedError}", logData.RequestData, endpoint, detailedError);
            await db.CreateLogInternal(userId, LogTypeEnum.AIChatFailure, logData);
            return Results.Problem($"AI Chat Error: {detailedError}.");
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

    private static bool FirstIsArray(ExerciseTypesEnum exType)
    {
        return exType switch
        {
            ExerciseTypesEnum.Matching or ExerciseTypesEnum.MatchingToSpoken => true,
            _ => false,
        };
    }

    private static bool SecondIsArray(ExerciseTypesEnum exType)
    {
        return exType switch
        {
            ExerciseTypesEnum.Matching or ExerciseTypesEnum.MatchingToSpoken
            or ExerciseTypesEnum.CommonResponsesBucket
            => true,
            _ => false,
        };
    }

    private static string TransformToClientJson(string rawJson)
    {
        // 1. Parse the LLM response
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var newResult = JsonSerializer.Deserialize<NewSchemaRoot>(rawJson, options);

        var legacyContent = new List<OriginalSchemaItem>();

        if (newResult == null || newResult.Content == null)
        {
            return rawJson; // Return the original JSON if parsing fails
        }

        foreach (var item in newResult.Content)
        {
            string finalFirst = "";
            string finalSecond = "";

            bool secondIsArray = false;

            // CASE A: Matches (Both First and Second were treated as arrays)
            if (item.Matches != null && item.Matches.Count > 0)
            {
                // Aggregate all "First" values and all "Second" values into comma-separated strings
                finalFirst = string.Join(",", item.Matches.Select(m => m.First.Replace(",", " ")));
                finalSecond = string.Join(",", item.Matches.Select(m => m.Second.Replace(",", " ")));
            }
            // CASE B: Standard or "Second only is Array" structure
            else
            {
                finalFirst = item.First ?? "";

                if (item.Second.HasValue)
                {
                    secondIsArray = item.Second.Value.ValueKind == JsonValueKind.Array;
                    // If Second is an array, join it. If it's a string, just take it.
                    finalSecond = secondIsArray
                        ? string.Join(",", item.Second.Value.EnumerateArray().Select(x => x.GetString()?.Replace(",", " "))) // Replace commas in individual items to avoid confusion
                        : item.Second.Value.GetString() ?? "";
                }
            }

            // Convert ExtraOptions array back to a single space-separated string
            string? legacyExtraOptions = item.ExtraOptions != null
            ? string.Join(secondIsArray ? "," : " ", item.ExtraOptions.Select(opt => secondIsArray ? opt.Replace(",", " ") : opt))
            : null;

            // Add the single aggregated item to the list
            legacyContent.Add(new OriginalSchemaItem
            {
                First = finalFirst,
                Second = finalSecond,
                Translation = item.Translation,
                ExtraOptions = legacyExtraOptions
            });
        }

        // 3. Serialize back to the original JSON format
        return JsonSerializer.Serialize(new { content = legacyContent });
    }

    private static async Task<string> AutoSelectModel(string preferredModel, string endpoint, string apiKey, HttpClient httpClient, ILogger<Program> logger, AyalasLanguageDbContext db, int userId)
    {
        var endpointUrl = $"{endpoint.TrimEnd('/')}/models";
        string? model = null;
        try 
        {
            using var modelRequest = new HttpRequestMessage(HttpMethod.Get, endpointUrl);
            modelRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            
            var response = await httpClient.SendAsync(modelRequest);
            response.EnsureSuccessStatusCode();
            
            var modelList = await response.Content.ReadFromJsonAsync<ModelListResponse>();

            var models = modelList?.Data?.Where(m => m.Id.Equals(preferredModel, StringComparison.OrdinalIgnoreCase)).ToList();
            model = models?.Where(m => m.Id.Equals(preferredModel, StringComparison.OrdinalIgnoreCase)).FirstOrDefault()?.Id;
            if (string.IsNullOrEmpty(model))
            {
                model = modelList?.Data?.FirstOrDefault()?.Id;
                logger.LogWarning("Preferred model not found in models list from the AI endpoint. Using first instead: {model}", model);
            }
            if (string.IsNullOrEmpty(model))
            {
                logger.LogWarning("No models found in models list from the AI endpoint.");
                return preferredModel;
            }

            return model;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch dynamic model list.");

            var logData = new AIEndpointFailure
            {
                Error = ex.Message,
                RequestData = $"get dynamic model list for {preferredModel}",
                Endpoint = endpointUrl,
                Model = model ?? preferredModel,
                CallStack = ex.StackTrace
            };
            logger.LogError(ex, "AI Chat Error:{request}. {endpoint}: {detailedError}", logData.RequestData, endpoint, ex.Message);
            await db.CreateLogInternal(userId, LogTypeEnum.AIChatFailure, logData);
            return preferredModel;
        }
    }
}

internal record ModelListResponse(
    [property: JsonPropertyName("data")] List<ModelInfo> Data
);

internal record ModelInfo(
    [property: JsonPropertyName("id")] string Id
);

// The structure the LLM returns now
internal class NewSchemaRoot
{
    public required List<NewSchemaItem> Content { get; set; }
}

internal class NewSchemaItem
{
    // These might be null depending on the ExerciseType logic
    public string? First { get; set; }
    public JsonElement? Second { get; set; } // Using JsonElement because it could be string OR array
    public List<MatchItem>? Matches { get; set; }
    public string? Translation { get; set; }
    public List<string>? ExtraOptions { get; set; }
}

internal class MatchItem
{
    public required string First { get; set; }
    public required string Second { get; set; }
}

// The structure your legacy client expects
internal class OriginalSchemaItem
{
    public required string First { get; set; }
    public required string Second { get; set; }
    public string? Translation { get; set; }
    public string? ExtraOptions { get; set; }
}