using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.MySQL
{
    /// <inheritdoc />
    public partial class TokenHashMySQL : Migration
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
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TokenHash",
                table: "Tokens",
                type: "varchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "Tokens",
                type: "varchar(256)",
                maxLength: 256,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

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
                type: "varchar(1024)",
                maxLength: 1024,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}
