using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class TokenHashSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Content",
                table: "Tokens");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUsedAt",
                table: "Tokens",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TokenHash",
                table: "Tokens",
                type: "TEXT",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "Tokens",
                type: "TEXT",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tokens_AppId_TokenHash",
                table: "Tokens",
                columns: new[] { "AppId", "TokenHash" },
                unique: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tokens_AppId_TokenHash",
                table: "Tokens");

            migrationBuilder.DropColumn(
                name: "LastUsedAt",
                table: "Tokens");

            migrationBuilder.DropColumn(
                name: "TokenHash",
                table: "Tokens");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                table: "Tokens");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Tokens",
                type: "TEXT",
                maxLength: 1024,
                nullable: false,
                defaultValue: "");
        }
    }
}
