using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class RemoveNextPrevLogicSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_KnownLanguageId",
                table: "LearningPaths");

            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_TargetLanguageId_KnownLanguageId_Level_Chapter",
                table: "LearningPaths");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_KnownLanguageId_TargetLanguageId_Level_Chapter",
                table: "LearningPaths",
                columns: new[] { "KnownLanguageId", "TargetLanguageId", "Level", "Chapter" });

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_TargetLanguageId",
                table: "LearningPaths",
                column: "TargetLanguageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_KnownLanguageId_TargetLanguageId_Level_Chapter",
                table: "LearningPaths");

            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_TargetLanguageId",
                table: "LearningPaths");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_KnownLanguageId",
                table: "LearningPaths",
                column: "KnownLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_TargetLanguageId_KnownLanguageId_Level_Chapter",
                table: "LearningPaths",
                columns: new[] { "TargetLanguageId", "KnownLanguageId", "Level", "Chapter" },
                unique: true);
        }
    }
}
