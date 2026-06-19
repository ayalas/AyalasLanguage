using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.MySQL
{
    /// <inheritdoc />
    public partial class DeleteExerciseFKIssuesChapterChangeMySQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_Exercises_SourceExerciseId",
                table: "Exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProgresses_Exercises_ExerciseId",
                table: "UserProgresses");

            migrationBuilder.AlterColumn<decimal>(
                name: "Chapter",
                table: "LearningPaths",
                type: "decimal(65,30)",
                nullable: false,
                oldClrType: typeof(byte),
                oldType: "tinyint unsigned");

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_Exercises_SourceExerciseId",
                table: "Exercises",
                column: "SourceExerciseId",
                principalTable: "Exercises",
                principalColumn: "ExerciseId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserProgresses_Exercises_ExerciseId",
                table: "UserProgresses",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "ExerciseId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_Exercises_SourceExerciseId",
                table: "Exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProgresses_Exercises_ExerciseId",
                table: "UserProgresses");

            migrationBuilder.AlterColumn<byte>(
                name: "Chapter",
                table: "LearningPaths",
                type: "tinyint unsigned",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_Exercises_SourceExerciseId",
                table: "Exercises",
                column: "SourceExerciseId",
                principalTable: "Exercises",
                principalColumn: "ExerciseId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProgresses_Exercises_ExerciseId",
                table: "UserProgresses",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "ExerciseId");
        }
    }
}
