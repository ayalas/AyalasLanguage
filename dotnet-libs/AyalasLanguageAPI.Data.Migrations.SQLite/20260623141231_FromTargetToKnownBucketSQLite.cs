using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class FromTargetToKnownBucketSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 1,
                column: "Name",
                value: "From known to target language");

            migrationBuilder.UpdateData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 2,
                column: "Name",
                value: "From target to known language");

            migrationBuilder.UpdateData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 5,
                column: "Name",
                value: "From known to target language - bucket list");

            migrationBuilder.InsertData(
                table: "ExerciseTypes",
                columns: new[] { "ExerciseTypeId", "Name" },
                values: new object[] { 8, "From target to known language - bucket list" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 8);

            migrationBuilder.UpdateData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 1,
                column: "Name",
                value: "from Known to target language");

            migrationBuilder.UpdateData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 2,
                column: "Name",
                value: "from target to Known language");

            migrationBuilder.UpdateData(
                table: "ExerciseTypes",
                keyColumn: "ExerciseTypeId",
                keyValue: 5,
                column: "Name",
                value: "from Known to target language - bucket list");
        }
    }
}
