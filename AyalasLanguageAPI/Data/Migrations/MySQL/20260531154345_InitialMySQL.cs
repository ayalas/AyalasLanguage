using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AyalasLanguageAPI.Data.Migrations.MySQL
{
    /// <inheritdoc />
    public partial class InitialMySQL : Migration
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
                    NativeName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 5, nullable: true),
                    IsRightToLeft = table.Column<bool>(type: "INTEGER", nullable: false)
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
                    Role = table.Column<byte>(type: "INTEGER", nullable: false),
                    TargetLanguageId = table.Column<int>(type: "INTEGER", nullable: true),
                    KnownLanguageId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Users_Languages_KnownLanguageId",
                        column: x => x.KnownLanguageId,
                        principalTable: "Languages",
                        principalColumn: "LanguageId");
                    table.ForeignKey(
                        name: "FK_Users_Languages_TargetLanguageId",
                        column: x => x.TargetLanguageId,
                        principalTable: "Languages",
                        principalColumn: "LanguageId");
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
                    TargetLanguageId = table.Column<int>(type: "INTEGER", nullable: false),
                    KnownLanguageId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<byte>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningPaths", x => x.LearningPathId);
                    table.ForeignKey(
                        name: "FK_LearningPaths_Languages_KnownLanguageId",
                        column: x => x.KnownLanguageId,
                        principalTable: "Languages",
                        principalColumn: "LanguageId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LearningPaths_Languages_TargetLanguageId",
                        column: x => x.TargetLanguageId,
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
                        name: "FK_LearningPaths_LearningPaths_PrevLearningPathId",
                        column: x => x.PrevLearningPathId,
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
                name: "Tokens",
                columns: table => new
                {
                    TokenId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Content = table.Column<string>(type: "TEXT", maxLength: 1024, nullable: false),
                    ExpiresOn = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tokens", x => x.TokenId);
                    table.ForeignKey(
                        name: "FK_Tokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserExerciseTypes",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ExerciseTypeId = table.Column<int>(type: "INTEGER", nullable: false)
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
                    TargetLanguageId = table.Column<int>(type: "INTEGER", nullable: false),
                    KnownLanguageId = table.Column<int>(type: "INTEGER", nullable: false),
                    LearningPathId = table.Column<int>(type: "INTEGER", nullable: true),
                    ExerciseTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    Data = table.Column<string>(type: "TEXT", maxLength: 8192, nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<byte>(type: "INTEGER", nullable: false)
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
                        name: "FK_Exercises_Languages_KnownLanguageId",
                        column: x => x.KnownLanguageId,
                        principalTable: "Languages",
                        principalColumn: "LanguageId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Exercises_Languages_TargetLanguageId",
                        column: x => x.TargetLanguageId,
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
                    LearningPathId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ExerciseId = table.Column<int>(type: "INTEGER", nullable: true),
                    practiseMistakesInThisPath = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProgresses", x => new { x.UserId, x.LearningPathId });
                    table.ForeignKey(
                        name: "FK_UserProgresses_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "ExerciseId");
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
                columns: new[] { "LanguageId", "Code", "EnglishName", "IsRightToLeft", "NativeName" },
                values: new object[,]
                {
                    { 1, "en", "English", false, "English" },
                    { 2, "ar", "Arabic", true, "العربية" },
                    { 3, "da", "Danish", false, "Dansk" },
                    { 4, "es", "Spanish", false, "Español" },
                    { 5, "fr", "French", false, "Français" },
                    { 6, "de", "German", false, "Deutsch" },
                    { 7, "ja", "Japanese", false, "日本語" },
                    { 8, "zh", "Mandarin Chinese", false, "普通话" },
                    { 9, "hi", "Hindi", false, "हिन्दी" },
                    { 10, "pt", "Portuguese", false, "Português" },
                    { 11, "ru", "Russian", false, "Русский" },
                    { 12, "bn", "Bengali", false, "বাংলা" },
                    { 13, "ko", "Korean", false, "한국어" },
                    { 14, "it", "Italian", false, "Italiano" },
                    { 15, "tr", "Turkish", false, "Türkçe" },
                    { 16, "vi", "Vietnamese", false, "Tiếng Việt" },
                    { 17, "te", "Telugu", false, "తెలుగు" },
                    { 18, "mr", "Marathi", false, "मराठी" },
                    { 19, "ta", "Tamil", false, "தமிழ்" },
                    { 20, "ur", "Urdu", true, "اردو" },
                    { 21, "el", "Greek", false, "Ελληνικά" },
                    { 22, "nl", "Dutch", false, "Nederlands" },
                    { 23, "sv", "Swedish", false, "Svenska" },
                    { 24, "no", "Norwegian", false, "Norsk" },
                    { 25, "pl", "Polish", false, "Polski" },
                    { 26, "fi", "Finnish", false, "Suomi" },
                    { 27, "cs", "Czech", false, "Čeština" },
                    { 28, "hu", "Hungarian", false, "Magyar" },
                    { 29, "th", "Thai", false, "ไทย" },
                    { 30, "id", "Indonesian", false, "Bahasa Indonesia" },
                    { 31, "ro", "Romanian", false, "Română" },
                    { 32, "uk", "Ukrainian", false, "Українська" },
                    { 33, "he", "Hebrew", true, "עברית" },
                    { 34, "ms", "Malay", false, "Bahasa Melayu" },
                    { 35, "fa", "Persian", true, "فارسی" },
                    { 36, "sk", "Slovak", false, "Slovenčina" },
                    { 37, "ca", "Catalan", false, "Català" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_ExerciseTypeId",
                table: "Exercises",
                column: "ExerciseTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_KnownLanguageId",
                table: "Exercises",
                column: "KnownLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_LearningPathId",
                table: "Exercises",
                column: "LearningPathId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_TargetLanguageId",
                table: "Exercises",
                column: "TargetLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_UserId",
                table: "Exercises",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_KnownLanguageId",
                table: "LearningPaths",
                column: "KnownLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_NextLearningPathId",
                table: "LearningPaths",
                column: "NextLearningPathId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_PrevLearningPathId",
                table: "LearningPaths",
                column: "PrevLearningPathId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_TargetLanguageId_KnownLanguageId_Level_Chapter",
                table: "LearningPaths",
                columns: new[] { "TargetLanguageId", "KnownLanguageId", "Level", "Chapter" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LearningPaths_UserId",
                table: "LearningPaths",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tokens_UserId",
                table: "Tokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserExerciseTypes_ExerciseTypeId",
                table: "UserExerciseTypes",
                column: "ExerciseTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLanguages_LanguageId",
                table: "UserLanguages",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_UserProgresses_ExerciseId",
                table: "UserProgresses",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_UserProgresses_LearningPathId",
                table: "UserProgresses",
                column: "LearningPathId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_KnownLanguageId",
                table: "Users",
                column: "KnownLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TargetLanguageId",
                table: "Users",
                column: "TargetLanguageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tokens");

            migrationBuilder.DropTable(
                name: "UserExerciseTypes");

            migrationBuilder.DropTable(
                name: "UserLanguages");

            migrationBuilder.DropTable(
                name: "UserProgresses");

            migrationBuilder.DropTable(
                name: "Exercises");

            migrationBuilder.DropTable(
                name: "ExerciseTypes");

            migrationBuilder.DropTable(
                name: "LearningPaths");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Languages");
        }
    }
}
