using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Data.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using OpenAI.Chat;

namespace AyalasLanguageAPI.Endpoints.Inbox
{
    public static class InboxEndpoints
    {
        public static void MapInboxEndpoints(this IEndpointRouteBuilder app, string prefix)
        {
            var inboxGroup = app.MapGroup($"{prefix}/inbox")
                .AddEndpointFilter<ErrorLoggingFilter>().WithTags("Inbox")
                .RequireAuthorization(new AuthorizeAttribute
                {
                    AuthenticationSchemes = "PublicAuth"
                });
            inboxGroup.MapPost("/message", SendMessageToUser);
            inboxGroup.MapDelete("/message/{messageId:int}", DeleteUserMessage);
            inboxGroup.MapGet("/message/{messageId:int}", GetUserMessage);
            inboxGroup.MapGet("/{page:int}", GetUserMessages);
        }

        private static async Task<IResult> SendMessageToUser(SendUserMessageRequestDto request, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();

            //assert that the recepient has sent a message to the sender
            // or that this is in regards to a lesson owned by the recepient
            bool exists = false;
            if (request.LearningPathId != null)
            {
                exists = await db.LearningPaths
                .AnyAsync(lp => lp.LearningPathId == request.LearningPathId && lp.UserId == request.ToUserId);
            }
            else if (request.InResponseToUserMessageId == null)
            {
                return Results.BadRequest("Missing InResponseToUserMessageId");
            }
            else
            {
                exists = await db.UserMessages
                .AnyAsync(um => um.UserMessageId == request.InResponseToUserMessageId &&
                     um.FromUserId == request.ToUserId && um.ToUserId == userId);
            }

            if (!exists)
                return Results.Forbid();

            UserMessage um = new()
            {
                FromUserId = userId,
                LearningPathId = request.LearningPathId,
                ToUserId = request.ToUserId,
                Message = request.Message,
                InResponseToUserMessageId = request.InResponseToUserMessageId
            };

            db.UserMessages.Add(um);
            await db.SaveChangesAsync();
            return Results.Created($"/api/inbox/message/{um.UserMessageId}", new SendUserMessageResponseDto(um.UserMessageId));
        }

        private static async Task<IResult> DeleteUserMessage (int messageId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var msg = await db.UserMessages.FirstOrDefaultAsync(um => um.UserMessageId == messageId);

            if (msg == null)
                return Results.NotFound();

            //does the user has permission to delete this message?
            if (msg.FromUserId != userId)
                return Results.Forbid();

            //delete from UserMessages
            db.UserMessages.Remove(msg);
            await db.SaveChangesAsync();

            return Results.NoContent();
        }

        private static async Task<IResult> GetUserMessage(int messageId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var msg = await db.UserMessages
                .Where(m => m.UserMessageId == messageId)
                .Select(m => new UserMessageDto(
                    m.UserMessageId,
                    m.FromUserId,
                    m.ToUserId,
                    m.InResponseToUserMessageId != null? m.ToUser.DisplayName : "",  //privacy protection
                    m.LearningPathId,
                    m.Message,
                    m.LearningPathId == null? null: m.LearningPath.Name
                )).FirstOrDefaultAsync();

            if (msg == null)
                return Results.NotFound();

            //does the user has permission to read this message?
            if (msg.FromUserId != userId && msg.ToUserId != userId)
                return Results.Forbid();

            return Results.Ok(msg);
        }

        private static async Task<PagedResponse<UserMessageDto>> GetUserMessages(int page, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var arr = await db.UserMessages
                .Where(m => m.FromUserId == userId || m.ToUserId == userId)
                .Select(m => new UserMessageDto(
                    m.UserMessageId,
                    m.FromUserId,
                    m.ToUserId,
                    m.InResponseToUserMessageId != null? m.ToUser.DisplayName : "", //privacy protection
                    m.LearningPathId,
                    m.Message,
                    m.LearningPathId == null? null: m.LearningPath.Name
                ))
                .Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1).ToArrayAsync();

            int numOfRecords = 0;
            if (page == 0)
                numOfRecords = await db.Users.CountAsync();
            return new PagedResponse<UserMessageDto>(numOfRecords, arr);
        }
    }
}