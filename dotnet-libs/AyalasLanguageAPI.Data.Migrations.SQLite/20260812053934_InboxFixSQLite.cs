using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class InboxFixSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserMessages",
                columns: table => new
                {
                    UserMessageId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FromUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ToUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    LearningPathId = table.Column<int>(type: "INTEGER", nullable: true),
                    Message = table.Column<string>(type: "TEXT", maxLength: 20000, nullable: false),
                    InResponseToUserMessageId = table.Column<int>(type: "INTEGER", nullable: true)
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
                        name: "FK_UserMessages_UserMessages_InResponseToUserMessageId",
                        column: x => x.InResponseToUserMessageId,
                        principalTable: "UserMessages",
                        principalColumn: "UserMessageId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserMessages_Users_FromUserId",
                        column: x => x.FromUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserMessages_Users_ToUserId",
                        column: x => x.ToUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserMessages_FromUserId",
                table: "UserMessages",
                column: "FromUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMessages_InResponseToUserMessageId",
                table: "UserMessages",
                column: "InResponseToUserMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMessages_LearningPathId",
                table: "UserMessages",
                column: "LearningPathId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMessages_ToUserId",
                table: "UserMessages",
                column: "ToUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserMessages");
        }
    }
}
