using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class FromOneToTwoLang : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_Languages_LanguageId",
                table: "Exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_LearningPaths_Languages_LanguageId",
                table: "LearningPaths");

            migrationBuilder.RenameColumn(
                name: "LanguageId",
                table: "LearningPaths",
                newName: "TargetLanguageId");

            migrationBuilder.RenameIndex(
                name: "IX_LearningPaths_LanguageId",
                table: "LearningPaths",
                newName: "IX_LearningPaths_TargetLanguageId");

            migrationBuilder.RenameColumn(
                name: "LanguageId",
                table: "Exercises",
                newName: "TargetLanguageId");

            migrationBuilder.RenameIndex(
                name: "IX_Exercises_LanguageId",
                table: "Exercises",
                newName: "IX_Exercises_TargetLanguageId");

            migrationBuilder.AddColumn<int>(
                name: "KnownLanguageId",
                table: "LearningPaths",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "KnownLanguageId",
                table: "Exercises",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_KnownLanguageId",
                table: "LearningPaths",
                column: "KnownLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_KnownLanguageId",
                table: "Exercises",
                column: "KnownLanguageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_Languages_KnownLanguageId",
                table: "Exercises",
                column: "KnownLanguageId",
                principalTable: "Languages",
                principalColumn: "LanguageId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_Languages_TargetLanguageId",
                table: "Exercises",
                column: "TargetLanguageId",
                principalTable: "Languages",
                principalColumn: "LanguageId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LearningPaths_Languages_KnownLanguageId",
                table: "LearningPaths",
                column: "KnownLanguageId",
                principalTable: "Languages",
                principalColumn: "LanguageId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LearningPaths_Languages_TargetLanguageId",
                table: "LearningPaths",
                column: "TargetLanguageId",
                principalTable: "Languages",
                principalColumn: "LanguageId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_Languages_KnownLanguageId",
                table: "Exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_Languages_TargetLanguageId",
                table: "Exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_LearningPaths_Languages_KnownLanguageId",
                table: "LearningPaths");

            migrationBuilder.DropForeignKey(
                name: "FK_LearningPaths_Languages_TargetLanguageId",
                table: "LearningPaths");

            migrationBuilder.DropIndex(
                name: "IX_LearningPaths_KnownLanguageId",
                table: "LearningPaths");

            migrationBuilder.DropIndex(
                name: "IX_Exercises_KnownLanguageId",
                table: "Exercises");

            migrationBuilder.DropColumn(
                name: "KnownLanguageId",
                table: "LearningPaths");

            migrationBuilder.DropColumn(
                name: "KnownLanguageId",
                table: "Exercises");

            migrationBuilder.RenameColumn(
                name: "TargetLanguageId",
                table: "LearningPaths",
                newName: "LanguageId");

            migrationBuilder.RenameIndex(
                name: "IX_LearningPaths_TargetLanguageId",
                table: "LearningPaths",
                newName: "IX_LearningPaths_LanguageId");

            migrationBuilder.RenameColumn(
                name: "TargetLanguageId",
                table: "Exercises",
                newName: "LanguageId");

            migrationBuilder.RenameIndex(
                name: "IX_Exercises_TargetLanguageId",
                table: "Exercises",
                newName: "IX_Exercises_LanguageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_Languages_LanguageId",
                table: "Exercises",
                column: "LanguageId",
                principalTable: "Languages",
                principalColumn: "LanguageId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LearningPaths_Languages_LanguageId",
                table: "LearningPaths",
                column: "LanguageId",
                principalTable: "Languages",
                principalColumn: "LanguageId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
