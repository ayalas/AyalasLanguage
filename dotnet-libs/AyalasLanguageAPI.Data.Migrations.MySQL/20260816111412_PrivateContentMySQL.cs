using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AyalasLanguageAPI.Data.Migrations.MySQL
{
    /// <inheritdoc />
    public partial class PrivateContentMySQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_LearningPaths_LearningPathId",
                table: "Exercises");

            migrationBuilder.DropTable(
                name: "UserExerciseTypes");

            migrationBuilder.AddColumn<byte>(
                name: "OwnershipType",
                table: "LearningPaths",
                type: "tinyint unsigned",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<byte>(
                name: "OwnershipType",
                table: "Exercises",
                type: "tinyint unsigned",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_LearningPaths_LearningPathId",
                table: "Exercises",
                column: "LearningPathId",
                principalTable: "LearningPaths",
                principalColumn: "LearningPathId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_LearningPaths_LearningPathId",
                table: "Exercises");

            migrationBuilder.DropColumn(
                name: "OwnershipType",
                table: "LearningPaths");

            migrationBuilder.DropColumn(
                name: "OwnershipType",
                table: "Exercises");

            migrationBuilder.CreateTable(
                name: "UserExerciseTypes",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ExerciseTypeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserExerciseTypes", x => new { x.UserId, x.ExerciseTypeId });
                    table.ForeignKey(
                        name: "FK_UserExerciseTypes_ExerciseTypes_ExerciseTypeId",
                        column: x => x.ExerciseTypeId,
                        principalTable: "ExerciseTypes",
                        principalColumn: "ExerciseTypeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserExerciseTypes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_UserExerciseTypes_ExerciseTypeId",
                table: "UserExerciseTypes",
                column: "ExerciseTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_LearningPaths_LearningPathId",
                table: "Exercises",
                column: "LearningPathId",
                principalTable: "LearningPaths",
                principalColumn: "LearningPathId");
        }
    }
}
