using System;

namespace Backend.Models
{
    public class ComplexityQuestion
    {
        public int Id { get; set; }
        
        /// <summary>The code snippet displayed to the user</summary>
        public string CodeSnippet { get; set; } = string.Empty;

        /// <summary>Language (e.g., cpp, python, java) for syntax highlighting</summary>
        public string Language { get; set; } = string.Empty;

        /// <summary>Expected format: O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n), O(n!)</summary>
        public string CorrectAnswer { get; set; } = string.Empty;

        /// <summary>Semi-colon separated list of 4 options, e.g., "O(1);O(log n);O(n);O(n^2)"</summary>
        public string OptionsRaw { get; set; } = string.Empty;

        /// <summary>Difficulty level: Easy, Medium, Hard</summary>
        public string Difficulty { get; set; } = string.Empty;

        /// <summary>Explanation displayed after the user answers</summary>
        public string Explanation { get; set; } = string.Empty;

        // Helper property to parse options on C# side if needed
        public string[] Options => OptionsRaw.Split(';', StringSplitOptions.RemoveEmptyEntries);
    }
}
