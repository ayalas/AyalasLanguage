using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.SQLite
{
    /// <inheritdoc />
    public partial class JobsSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedOn",
                table: "UserProgresses",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "Jobs",
                columns: table => new
                {
                    JobId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    JobType = table.Column<byte>(type: "INTEGER", nullable: false),
                    JobStatus = table.Column<byte>(type: "INTEGER", nullable: false),
                    MainRecordId = table.Column<int>(type: "INTEGER", nullable: true),
                    SecondaryRecordId = table.Column<int>(type: "INTEGER", nullable: true),
                    ExtraData = table.Column<string>(type: "TEXT", maxLength: 512, nullable: true),
                    Completed = table.Column<int>(type: "INTEGER", nullable: false),
                    Errors = table.Column<int>(type: "INTEGER", nullable: false),
                    LeftToProcess = table.Column<int>(type: "INTEGER", nullable: true),
                    FirstError = table.Column<string>(type: "TEXT", maxLength: 8000, nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ModifiedOn = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jobs", x => x.JobId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Jobs");

            migrationBuilder.DropColumn(
                name: "ModifiedOn",
                table: "UserProgresses");
        }
    }
}
