using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class AlternativeAnswersSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SourceExerciseId",
                table: "Exercises",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_SourceExerciseId",
                table: "Exercises",
                column: "SourceExerciseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_Exercises_SourceExerciseId",
                table: "Exercises",
                column: "SourceExerciseId",
                principalTable: "Exercises",
                principalColumn: "ExerciseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_Exercises_SourceExerciseId",
                table: "Exercises");

            migrationBuilder.DropIndex(
                name: "IX_Exercises_SourceExerciseId",
                table: "Exercises");

            migrationBuilder.DropColumn(
                name: "SourceExerciseId",
                table: "Exercises");
        }
    }
}
