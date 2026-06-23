using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class MatchingToSpokenSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 3,
                column: "Name",
                value: "Fill in the blank");

            migrationBuilder.InsertData(
                table: "ExerciseTypes",
                columns: new[] { "ExerciseTypeId", "Name" },
                values: new object[] { 9, "Matching to spoken word" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 9);

            migrationBuilder.UpdateData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 3,
                column: "Name",
                value: "Fill in the Blank");
        }
    }
}
