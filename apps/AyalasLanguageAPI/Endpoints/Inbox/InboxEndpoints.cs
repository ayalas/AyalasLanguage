using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Data.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

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
            inboxGroup.MapGet("/contacts", GetUserContacts);
            inboxGroup.MapPost("/contacts", CreateContact);
        }

        private static async Task<IResult> CreateContact(CreateUserContactRequestDto request, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();

            UserContact uc = new()
            {
                UserId = userId,
                ContactName = request.ContactName,
                ContactUserId = request.ContactUserId,
                Notes = request.Notes
            };

            db.UserContacts.Add(uc);
            await db.SaveChangesAsync();
            return Results.Created($"/api/inbox/contact/{uc.UserContactId}", new CreateUserContactResponseDto(uc.UserContactId));
        }

        private static async Task<IResult> SendMessageToUser(SendUserMessageRequestDto request, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();

            //validate that the contact is a contact of this user
            var exists = await db.UserContacts
                .AnyAsync(uc => uc.UserId == userId && uc.UserContactId == request.ToUserContactId);

            if (!exists)
                return Results.Forbid();

            UserMessage um = new()
            {
                FromUserId = userId,
                LearningPathId = request.LearningPathId,
                ToUserContactId = request.ToUserContactId,
                Message = request.Message
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

        private static async Task<ContactDto[]> GetUserContacts(ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var arr = await db.UserContacts
            .Where( uc => uc.UserId == userId)
            .Select( uc => new ContactDto (
                uc.UserContactId,
                uc.ContactUserId,
                uc.ContactName,
                uc.Notes
            )).ToArrayAsync();

            return arr;
        }

        private static async Task<IResult> GetUserMessage(int messageId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var msg = await db.UserMessages
                .Where(m => m.UserMessageId == messageId)
                .Select(m => new UserMessageDto(
                    m.UserMessageId,
                    m.FromUserId,
                    m.ToUserContact.UserId,
                    m.ToUserContactId,
                    m.ToUserContact.ContactName,
                    m.LearningPathId,
                    m.Message
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
                .Where(m => m.FromUserId == userId || m.ToUserContact.UserId == userId)
                .Select(m => new UserMessageDto(
                    m.UserMessageId,
                    m.FromUserId,
                    m.ToUserContact.UserId,
                    m.ToUserContactId,
                    m.ToUserContact.ContactName,
                    m.LearningPathId,
                    m.Message
                ))
                .Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1).ToArrayAsync();

            int numOfRecords = 0;
            if (page == 0)
                numOfRecords = await db.Users.CountAsync();
            return new PagedResponse<UserMessageDto>(numOfRecords, arr);
        }
    }
}