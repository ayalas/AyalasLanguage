using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class DeleteExerciseFKIssuesChapterChangeSQLite : Migration
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
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(byte),
                oldType: "INTEGER");

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
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "TEXT");

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
