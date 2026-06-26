using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class DisablePuterSettingSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DisablePuter",
                table: "Users",
                type: "INTEGER",
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
