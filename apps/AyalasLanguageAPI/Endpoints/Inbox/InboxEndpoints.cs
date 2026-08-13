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
            int? toUserId = null;
            if (request.LearningPathId != null)
            {
                var temp = await db.LearningPaths
                    .Where(lp => lp.LearningPathId == request.LearningPathId)
                    .Select(lp => lp.UserId)
                    .FirstOrDefaultAsync();
                if (temp > 0)
                {
                    exists = true;
                    toUserId = temp;
                }
            }
            else if (request.InResponseToUserMessageId == null)
            {
                return Results.BadRequest("Missing InResponseToUserMessageId");
            }
            else
            {
                var temp = await db.UserMessages
                    .Where(um => um.UserMessageId == request.InResponseToUserMessageId
                        && um.ToUserId == userId)
                    .Select(um => um.FromUserId)
                    .FirstOrDefaultAsync();
                if (temp > 0)
                {
                    exists = true;
                    toUserId = temp;
                }
            }

            if (!exists || toUserId == null)
                return Results.Forbid();

            UserMessage um = new()
            {
                FromUserId = userId,
                LearningPathId = request.LearningPathId,
                ToUserId = toUserId.Value,
                Message = request.Message,
                InResponseToUserMessageId = request.InResponseToUserMessageId,
                SendDate = DateTime.UtcNow
            };

            db.UserMessages.Add(um);
            await db.SaveChangesAsync();
            return Results.Created($"/api/inbox/message/{um.UserMessageId}", new SendUserMessageResponseDto(um.UserMessageId));
        }

        private static async Task<IResult> DeleteUserMessage(int messageId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
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
            var message = await db.UserMessages
                .Include(m => m.ToUser)
                .Include(m => m.FromUser)
                .Include(m => m.LearningPath)
                 .FirstOrDefaultAsync(m => m.UserMessageId == messageId);

            if (message == null)
                return Results.NotFound();
  
            // 2. Permission Check
            if (message.FromUserId != userId && message.ToUserId != userId)
                return Results.Forbid();

            bool readWithRequest = false;
            // 3. Conditional Update
            if (!message.Read && message.ToUserId == userId)
            {
                message.Read = true;
                message.ReadDate = DateTime.UtcNow;
                await db.SaveChangesAsync(); // Persist the 'Read' status to the DB
                readWithRequest = true;
            }

            // 4. Manually map the entity back to the Dto
            var dto = new UserMessageDto(
                message.UserMessageId,
                message.FromUserId,
                message.FromUser.DisplayName,
                message.ToUserId,
                // privacy logic: only show name if it's a response
                message.InResponseToUserMessageId != null ? message.ToUser?.DisplayName ?? "" : "",
                message.LearningPathId,
                message.Message,
                message.LearningPath?.Name,
                message.SendDate,
                message.Read || message.FromUserId == userId,
                readWithRequest,
                message.InResponseToUserMessageId
            );

            return Results.Ok(dto);
        }

        private static async Task<PagedResponse<UserMessageDto>> GetUserMessages(int page, int? inResponseToMessageId, int? learningPathId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var baseQuery = db.UserMessages
                .Where(m => m.FromUserId == userId || m.ToUserId == userId).AsQueryable();

            if (inResponseToMessageId != null)
            {
                baseQuery = baseQuery.Where(m => m.InResponseToUserMessageId == inResponseToMessageId);
            }
            else if (learningPathId != null)
            {
               baseQuery = baseQuery.Where(m => m.LearningPathId == learningPathId); 
            }
            

            var arr = await baseQuery.OrderByDescending( m => m.UserMessageId)
                .Select(m => new UserMessageDto(
                    m.UserMessageId,
                    m.FromUserId,
                    m.FromUser.DisplayName,
                    m.ToUserId,
                    m.InResponseToUserMessageId != null ? m.ToUser.DisplayName : "", //privacy protection
                    m.LearningPathId,
                    m.Message,
                    m.LearningPathId == null ? null : m.LearningPath.Name,
                    m.SendDate,
                    m.Read || m.FromUserId == userId,
                    false,
                    m.InResponseToUserMessageId
                ))
                .Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1).ToArrayAsync();

            int numOfRecords = 0;
            if (page == 0)
                numOfRecords = await baseQuery.CountAsync();
            return new PagedResponse<UserMessageDto>(numOfRecords, arr);
        }
    }
}