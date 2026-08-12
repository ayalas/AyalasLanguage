using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.MySQL
{
    /// <inheritdoc />
    public partial class InboxFixMySQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserMessages",
                columns: table => new
                {
                    UserMessageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FromUserId = table.Column<int>(type: "int", nullable: false),
                    ToUserId = table.Column<int>(type: "int", nullable: false),
                    LearningPathId = table.Column<int>(type: "int", nullable: true),
                    Message = table.Column<string>(type: "longtext", maxLength: 20000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    InResponseToUserMessageId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMessages", x => x.UserMessageId);
                    table.ForeignKey(
                        name: "FK_UserMessages_LearningPaths_LearningPathId",
                        column: x => x.LearningPathId,
                        principalTable: "LearningPaths",
                        principalColumn: "LearningPathId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserMessages_Users_ToUserId",
                        column: x => x.ToUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserMessages_Users_FromUserId",
                        column: x => x.FromUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserMessages_UserMessages_InResponseToUserMessageId",
                        column: x => x.InResponseToUserMessageId,
                        principalTable: "UserMessages",
                        principalColumn: "UserMessageId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_UserMessages_FromUserId",
                table: "UserMessages",
                column: "FromUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMessages_LearningPathId",
                table: "UserMessages",
                column: "LearningPathId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMessages_ToUserId",
                table: "UserMessages",
                column: "ToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMessages_InResponseToUserMessageId",
                table: "UserMessages",
                column: "InResponseToUserMessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserMessages_LearningPaths_LearningPathId",
                table: "UserMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_UserMessages_UserMessages_InResponseToUserMessageId",
                table: "UserMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_UserMessages_Users_ToUserId",
                table: "UserMessages");

            migrationBuilder.DropIndex(
                name: "IX_UserMessages_InResponseToUserMessageId",
                table: "UserMessages");

            migrationBuilder.DropColumn(
                name: "InResponseToUserMessageId",
                table: "UserMessages");

            migrationBuilder.RenameColumn(
                name: "ToUserId",
                table: "UserMessages",
                newName: "ToUserContactId");

            migrationBuilder.RenameIndex(
                name: "IX_UserMessages_ToUserId",
                table: "UserMessages",
                newName: "IX_UserMessages_ToUserContactId");

            migrationBuilder.CreateTable(
                name: "UserContacts",
                columns: table => new
                {
                    UserContactId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ContactUserId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ContactName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserContacts", x => x.UserContactId);
                    table.UniqueConstraint("AK_UserContacts_UserId_ContactUserId", x => new { x.UserId, x.ContactUserId });
                    table.ForeignKey(
                        name: "FK_UserContacts_Users_ContactUserId",
                        column: x => x.ContactUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserContacts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_UserContacts_ContactUserId",
                table: "UserContacts",
                column: "ContactUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserMessages_LearningPaths_LearningPathId",
                table: "UserMessages",
                column: "LearningPathId",
                principalTable: "LearningPaths",
                principalColumn: "LearningPathId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserMessages_UserContacts_ToUserContactId",
                table: "UserMessages",
                column: "ToUserContactId",
                principalTable: "UserContacts",
                principalColumn: "UserContactId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
