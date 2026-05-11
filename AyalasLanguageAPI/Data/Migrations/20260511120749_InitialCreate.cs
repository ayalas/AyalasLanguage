using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AyalasLanguageAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExerciseTypes",
                columns: table => new
                {
                    ExerciseTypeId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExerciseTypes", x => x.ExerciseTypeId);
                });

            migrationBuilder.CreateTable(
                name: "Languages",
                columns: table => new
                {
                    LanguageId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EnglishName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    NativeName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Languages", x => x.LanguageId);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 1024, nullable: false),
                    Role = table.Column<byte>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "LearningPaths",
                columns: table => new
                {
                    LearningPathId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Level = table.Column<uint>(type: "INTEGER", nullable: false),
                    Chapter = table.Column<byte>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    PrevLearningPathId = table.Column<int>(type: "INTEGER", nullable: true),
                    NextLearningPathId = table.Column<int>(type: "INTEGER", nullable: true),
                    LanguageId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<byte>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningPaths", x => x.LearningPathId);
                    table.ForeignKey(
                        name: "FK_LearningPaths_Languages_LanguageId",
                        column: x => x.LanguageId,
                        principalTable: "Languages",
                        principalColumn: "LanguageId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LearningPaths_LearningPaths_NextLearningPathId",
                        column: x => x.NextLearningPathId,
                        principalTable: "LearningPaths",
                        principalColumn: "LearningPathId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LearningPaths_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserLanguages",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    LanguageId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsLearning = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLanguages", x => new { x.UserId, x.LanguageId });
                    table.ForeignKey(
                        name: "FK_UserLanguages_Languages_LanguageId",
                        column: x => x.LanguageId,
                        principalTable: "Languages",
                        principalColumn: "LanguageId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserLanguages_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Exercises",
                columns: table => new
                {
                    ExerciseId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    LanguageId = table.Column<int>(type: "INTEGER", nullable: false),
                    LearningPathId = table.Column<int>(type: "INTEGER", nullable: true),
                    ExerciseTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    Data = table.Column<string>(type: "TEXT", maxLength: 8192, nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exercises", x => x.ExerciseId);
                    table.ForeignKey(
                        name: "FK_Exercises_ExerciseTypes_ExerciseTypeId",
                        column: x => x.ExerciseTypeId,
                        principalTable: "ExerciseTypes",
                        principalColumn: "ExerciseTypeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Exercises_Languages_LanguageId",
                        column: x => x.LanguageId,
                        principalTable: "Languages",
                        principalColumn: "LanguageId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Exercises_LearningPaths_LearningPathId",
                        column: x => x.LearningPathId,
                        principalTable: "LearningPaths",
                        principalColumn: "LearningPathId");
                    table.ForeignKey(
                        name: "FK_Exercises_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserProgresses",
                columns: table => new
                {
                    LanguageId = table.Column<int>(type: "INTEGER", nullable: false),
                    LearningPathId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<byte>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProgresses", x => new { x.UserId, x.LanguageId, x.LearningPathId });
                    table.ForeignKey(
                        name: "FK_UserProgresses_Languages_LanguageId",
                        column: x => x.LanguageId,
                        principalTable: "Languages",
                        principalColumn: "LanguageId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserProgresses_LearningPaths_LearningPathId",
                        column: x => x.LearningPathId,
                        principalTable: "LearningPaths",
                        principalColumn: "LearningPathId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserProgresses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ExerciseTypes",
                columns: new[] { "ExerciseTypeId", "Name" },
                values: new object[,]
                {
                    { 1, "from Known to target language" },
                    { 2, "from target to Known language" },
                    { 3, "Fill in the Blank" },
                    { 4, "Matching" },
                    { 5, "from Known to target language - bucket list" }
                });

            migrationBuilder.InsertData(
                table: "Languages",
                columns: new[] { "LanguageId", "EnglishName", "NativeName" },
                values: new object[,]
                {
                    { 1, "English", "English" },
                    { 2, "Arabic", "العربية" },
                    { 3, "Danish", "Dansk" },
                    { 4, "Spanish", "Español" },
                    { 5, "French", "Français" },
                    { 6, "German", "Deutsch" },
                    { 7, "Japanese", "日本語" },
                    { 8, "Mandarin Chinese", "普通话" },
                    { 9, "Hindi", "हिन्दी" },
                    { 10, "Portuguese", "Português" },
                    { 11, "Russian", "Русский" },
                    { 12, "Bengali", "বাংলা" },
                    { 13, "Korean", "한국어" },
                    { 14, "Italian", "Italiano" },
                    { 15, "Turkish", "Türkçe" },
                    { 16, "Vietnamese", "Tiếng Việt" },
                    { 17, "Telugu", "తెలుగు" },
                    { 18, "Marathi", "मराठी" },
                    { 19, "Tamil", "தமிழ்" },
                    { 20, "Urdu", "اردو" },
                    { 21, "Greek", "Ελληνικά" },
                    { 22, "Dutch", "Nederlands" },
                    { 23, "Swedish", "Svenska" },
                    { 24, "Norwegian", "Norsk" },
                    { 25, "Polish", "Polski" },
                    { 26, "Finnish", "Suomi" },
                    { 27, "Czech", "Čeština" },
                    { 28, "Hungarian", "Magyar" },
                    { 29, "Thai", "ไทย" },
                    { 30, "Indonesian", "Bahasa Indonesia" },
                    { 31, "Romanian", "Română" },
                    { 32, "Ukrainian", "Українська" },
                    { 33, "Hebrew", "עברית" },
                    { 34, "Malay", "Bahasa Melayu" },
                    { 35, "Persian", "فارسی" },
                    { 36, "Slovak", "Slovenčina" },
                    { 37, "Catalan", "Català" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_ExerciseTypeId",
                table: "Exercises",
                column: "ExerciseTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_LanguageId",
                table: "Exercises",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_LearningPathId",
                table: "Exercises",
                column: "LearningPathId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_UserId",
                table: "Exercises",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_LanguageId",
                table: "LearningPaths",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_NextLearningPathId",
                table: "LearningPaths",
                column: "NextLearningPathId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_UserId",
                table: "LearningPaths",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLanguages_LanguageId",
                table: "UserLanguages",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_UserProgresses_LanguageId",
                table: "UserProgresses",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_UserProgresses_LearningPathId",
                table: "UserProgresses",
                column: "LearningPathId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Exercises");

            migrationBuilder.DropTable(
                name: "UserLanguages");

            migrationBuilder.DropTable(
                name: "UserProgresses");

            migrationBuilder.DropTable(
                name: "ExerciseTypes");

            migrationBuilder.DropTable(
                name: "LearningPaths");

            migrationBuilder.DropTable(
                name: "Languages");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
