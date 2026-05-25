using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_TargetLanguageId",
                table: "LearningPaths");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_TargetLanguageId_KnownLanguageId_Level_Chapter",
                table: "LearningPaths",
                columns: new[] { "TargetLanguageId", "KnownLanguageId", "Level", "Chapter" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_TargetLanguageId_KnownLanguageId_Level_Chapter",
                table: "LearningPaths");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_TargetLanguageId",
                table: "LearningPaths",
                column: "TargetLanguageId");
        }
    }
}
