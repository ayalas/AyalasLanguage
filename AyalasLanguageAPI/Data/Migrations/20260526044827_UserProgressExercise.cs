using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class UserProgressExercise : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExerciseId",
                table: "UserProgresses",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserProgresses_ExerciseId",
                table: "UserProgresses",
                column: "ExerciseId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProgresses_Exercises_ExerciseId",
                table: "UserProgresses",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "ExerciseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserProgresses_Exercises_ExerciseId",
                table: "UserProgresses");

            migrationBuilder.DropIndex(
                name: "IX_UserProgresses_ExerciseId",
                table: "UserProgresses");

            migrationBuilder.DropColumn(
                name: "ExerciseId",
                table: "UserProgresses");
        }
    }
}
