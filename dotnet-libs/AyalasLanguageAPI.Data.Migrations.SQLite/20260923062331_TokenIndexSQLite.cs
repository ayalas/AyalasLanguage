using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class TokenIndexSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tokens_AppId_TokenHash",
                table: "Tokens");

            migrationBuilder.CreateIndex(
                name: "IX_Tokens_AppId_TokenHash",
                table: "Tokens",
                columns: new[] { "AppId", "TokenHash" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tokens_AppId_TokenHash",
                table: "Tokens");

            migrationBuilder.CreateIndex(
                name: "IX_Tokens_AppId_TokenHash",
                table: "Tokens",
                columns: new[] { "AppId", "TokenHash" },
                unique: true);
        }
    }
}
