using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class ImproveAPIFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserProgresses_Languages_LanguageId",
                table: "UserProgresses");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserProgresses",
                table: "UserProgresses");

            migrationBuilder.DropIndex(
                name: "IX_UserProgresses_LanguageId",
                table: "UserProgresses");

            migrationBuilder.DropColumn(
                name: "LanguageId",
                table: "UserProgresses");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserProgresses",
                table: "UserProgresses",
                columns: new[] { "UserId", "LearningPathId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserProgresses",
                table: "UserProgresses");

            migrationBuilder.AddColumn<int>(
                name: "LanguageId",
                table: "UserProgresses",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserProgresses",
                table: "UserProgresses",
                columns: new[] { "UserId", "LanguageId", "LearningPathId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserProgresses_LanguageId",
                table: "UserProgresses",
                column: "LanguageId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProgresses_Languages_LanguageId",
                table: "UserProgresses",
                column: "LanguageId",
                principalTable: "Languages",
                principalColumn: "LanguageId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
