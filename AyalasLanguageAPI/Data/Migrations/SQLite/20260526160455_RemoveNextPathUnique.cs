using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class RemoveNextPathUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_NextLearningPathId",
                table: "LearningPaths");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_NextLearningPathId",
                table: "LearningPaths",
                column: "NextLearningPathId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_PrevLearningPathId",
                table: "LearningPaths",
                column: "PrevLearningPathId");

            migrationBuilder.AddForeignKey(
                name: "FK_LearningPaths_LearningPaths_PrevLearningPathId",
                table: "LearningPaths",
                column: "PrevLearningPathId",
                principalTable: "LearningPaths",
                principalColumn: "LearningPathId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LearningPaths_LearningPaths_PrevLearningPathId",
                table: "LearningPaths");

            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_NextLearningPathId",
                table: "LearningPaths");

            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_PrevLearningPathId",
                table: "LearningPaths");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_NextLearningPathId",
                table: "LearningPaths",
                column: "NextLearningPathId",
                unique: true);
        }
    }
}
