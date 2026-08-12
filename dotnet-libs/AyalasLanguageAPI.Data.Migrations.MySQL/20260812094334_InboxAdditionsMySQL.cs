using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.MySQL
{
    /// <inheritdoc />
    public partial class InboxAdditionsMySQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Read",
                table: "UserMessages",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReadDate",
                table: "UserMessages",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SendDate",
                table: "UserMessages",
                type: "datetime(6)",
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
