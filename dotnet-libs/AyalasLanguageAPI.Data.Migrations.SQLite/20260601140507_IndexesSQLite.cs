using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class IndexesSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LearningPaths_LearningPaths_NextLearningPathId",
                table: "LearningPaths");

            migrationBuilder.DropForeignKey(
                name: "FK_LearningPaths_LearningPaths_PrevLearningPathId",
                table: "LearningPaths");

            migrationBuilder.AddForeignKey(
                name: "FK_LearningPaths_LearningPaths_NextLearningPathId",
                table: "LearningPaths",
                column: "NextLearningPathId",
                principalTable: "LearningPaths",
                principalColumn: "LearningPathId");

            migrationBuilder.AddForeignKey(
                name: "FK_LearningPaths_LearningPaths_PrevLearningPathId",
                table: "LearningPaths",
                column: "PrevLearningPathId",
                principalTable: "LearningPaths",
                principalColumn: "LearningPathId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LearningPaths_LearningPaths_NextLearningPathId",
                table: "LearningPaths");

            migrationBuilder.DropForeignKey(
                name: "FK_LearningPaths_LearningPaths_PrevLearningPathId",
                table: "LearningPaths");

            migrationBuilder.AddForeignKey(
                name: "FK_LearningPaths_LearningPaths_NextLearningPathId",
                table: "LearningPaths",
                column: "NextLearningPathId",
                principalTable: "LearningPaths",
                principalColumn: "LearningPathId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_LearningPaths_LearningPaths_PrevLearningPathId",
                table: "LearningPaths",
                column: "PrevLearningPathId",
                principalTable: "LearningPaths",
                principalColumn: "LearningPathId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
