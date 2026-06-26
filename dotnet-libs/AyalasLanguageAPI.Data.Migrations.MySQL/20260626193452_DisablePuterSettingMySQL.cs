using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.MySQL
{
    /// <inheritdoc />
    public partial class DisablePuterSettingMySQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DisablePuter",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisablePuter",
                table: "Users");
        }
    }
}
