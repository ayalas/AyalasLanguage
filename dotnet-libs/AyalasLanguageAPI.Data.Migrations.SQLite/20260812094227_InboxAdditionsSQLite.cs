using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class InboxAdditionsSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Read",
                table: "UserMessages",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReadDate",
                table: "UserMessages",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SendDate",
                table: "UserMessages",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Read",
                table: "UserMessages");

            migrationBuilder.DropColumn(
                name: "ReadDate",
                table: "UserMessages");

            migrationBuilder.DropColumn(
                name: "SendDate",
                table: "UserMessages");
        }
    }
}
