using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.MySQL
{
    /// <inheritdoc />
    public partial class ScoreFixMySQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Score",
                table: "Users");

            migrationBuilder.AddColumn<int>(
                name: "Score",
                table: "UserLanguages",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Score",
                table: "UserLanguages");

            migrationBuilder.AddColumn<int>(
                name: "Score",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
