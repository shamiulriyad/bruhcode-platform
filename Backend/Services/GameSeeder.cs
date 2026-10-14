using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public static class GameSeeder
    {
        public static async Task SeedQuestionsAsync(AppDbContext db)
        {
            // 1. Seed Games master list
            if (!await db.Games.AnyAsync())
            {
                var games = new List<Game>
                {
                    new()
                    {
                        GameKey = "complexity_guess",
                        Name = "Complexity Quiz",
                        Category = "Speed & Recall",
                        Description = "Guess the time complexity of the given code snippets under time pressure!",
                        IconKey = "complexity",
                        IsActive = true
                    },
                    new()
                    {
                        GameKey = "debug_the_code",
                        Name = "Debug the Code",
                        Category = "Code Reading",
                        Description = "Find and fix the bugs in the provided code snippets!",
                        IconKey = "debug",
                        IsActive = true
                    },
                    new()
                    {
                        GameKey = "logic_ladder",
                        Name = "Logic Puzzle Ladder",
                        Category = "Pure Logic",
                        Description = "Climb the ladder by solving increasingly difficult logic grid puzzles!",
                        IconKey = "ladder",
                        IsActive = true
                    }
                };

                await db.Games.AddRangeAsync(games);
                await db.SaveChangesAsync();
            }

            var complexityGame = await db.Games.FirstOrDefaultAsync(g => g.GameKey == "complexity_guess");
            var debugGame = await db.Games.FirstOrDefaultAsync(g => g.GameKey == "debug_the_code");

            // 2. Seed Complexity Guess Questions
            if (complexityGame != null && !await db.GameQuestions.AnyAsync(q => q.GameId == complexityGame.Id))
            {
                var questions = new List<(string ContentJson, string Difficulty)>
                {
                    // Easy
                    (CreateContentJson(
                        "int sum = 0;\nfor (int i = 0; i < n; i++) {\n    sum += arr[i];\n}",
                        "cpp",
                        "O(n)",
                        "O(1);O(log n);O(n);O(n^2)",
                        "The loop runs exactly n times, performing a constant-time addition in each iteration. Thus, the time complexity is linear."
                    ), "Easy"),
                    (CreateContentJson(
                        "def binary_search(arr, target):\n    low = 0\n    high = len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
                        "python",
                        "O(log n)",
                        "O(1);O(log n);O(n);O(n log n)",
                        "At each step, the search space is divided in half. The number of steps required to reduce a size-n list to 1 is log2(n), giving logarithmic complexity."
                    ), "Easy"),
                    (CreateContentJson(
                        "for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n        matrix[i][j] = 0;\n    }\n}",
                        "java",
                        "O(n^2)",
                        "O(n);O(n log n);O(n^2);O(2^n)",
                        "There are nested loops where the outer loop runs n times and the inner loop runs n times for each outer iteration, resulting in n * n = n^2 operations."
                    ), "Easy"),
                    (CreateContentJson(
                        "def get_first_element(arr):\n    if len(arr) > 0:\n        return arr[0]\n    return None",
                        "python",
                        "O(1)",
                        "O(1);O(log n);O(n);O(n^2)",
                        "This function performs a constant number of operations (checking length and returning an element) regardless of the size of the input array."
                    ), "Easy"),
                    (CreateContentJson(
                        "int i = n;\nwhile (i > 1) {\n    i = i / 2;\n}",
                        "cpp",
                        "O(log n)",
                        "O(1);O(log n);O(n);O(n log n)",
                        "In each step, the value of i is divided by 2. This halving process takes log2(n) steps to reach 1, giving logarithmic complexity."
                    ), "Easy"),
                    (CreateContentJson(
                        "for (int i = 0; i < n - 1; i++) {\n    for (int j = 0; j < n - i - 1; j++) {\n        if (arr[j] > arr[j+1]) {\n            swap(arr[j], arr[j+1]);\n        }\n    }\n}",
                        "cpp",
                        "O(n^2)",
                        "O(n);O(n log n);O(n^2);O(2^n)",
                        "This is standard Bubble Sort. It has a nested loop structure where the total comparison steps are n + (n-1) + ... + 1 = n*(n-1)/2, which is O(n^2)."
                    ), "Easy"),

                    // Medium
                    (CreateContentJson(
                        "int fib(int n) {\n    if (n <= 1) return n;\n    return fib(n - 1) + fib(n - 2);\n}",
                        "java",
                        "O(2^n)",
                        "O(n);O(n log n);O(2^n);O(n!)",
                        "Each call to fib results in two recursive calls. The recursion tree behaves like a binary tree of height n, giving exponential complexity of approximately O(2^n)."
                    ), "Medium"),
                    (CreateContentJson(
                        "void mergeSort(int arr[], int l, int r) {\n    if (l < r) {\n        int m = l + (r - l) / 2;\n        mergeSort(arr, l, m);\n        mergeSort(arr, m + 1, r);\n        merge(arr, l, m, r); // O(n) merge step\n    }\n}",
                        "cpp",
                        "O(n log n)",
                        "O(log n);O(n);O(n log n);O(n^2)",
                        "Merge Sort splits the array in half recursively (log n levels) and performs a linear-time merge operation at each level. The total time complexity is O(n log n)."
                    ), "Medium"),
                    (CreateContentJson(
                        "for (int i = 0; i < n; i++) {\n    int j = 1;\n    while (j < n) {\n        j = j * 2;\n    }\n}",
                        "cpp",
                        "O(n log n)",
                        "O(n);O(n log n);O(n^2);O(n^2 log n)",
                        "The outer loop runs n times. The inner loop doubles j until it reaches n, running log2(n) times. The total complexity is therefore O(n log n)."
                    ), "Medium"),

                    // Hard
                    (CreateContentJson(
                        "void permute(string str, int l, int r) {\n    if (l == r) {\n        cout << str << endl;\n    } else {\n        for (int i = l; i <= r; i++) {\n            swap(str[l], str[i]);\n            permute(str, l + 1, r);\n            swap(str[l], str[i]); // backtrack\n        }\n    }\n}",
                        "cpp",
                        "O(n!)",
                        "O(n^2);O(2^n);O(n!);O(n^n)",
                        "This generates all permutations of a string. The number of permutations of n elements is n!, and the algorithm does constant-time operations along with recursive calls for each, leading to O(n!) complexity."
                    ), "Hard"),
                    (CreateContentJson(
                        "def gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a",
                        "python",
                        "O(log n)",
                        "O(1);O(log n);O(n);O(n^2)",
                        "This is Euclid's algorithm for GCD. According to Lame's Theorem, the number of division steps is at most 5 times the number of digits in the smaller number, giving logarithmic complexity relative to the numbers' values."
                    ), "Hard"),
                    (CreateContentJson(
                        "for (int i = 1; i <= n; i++) {\n    for (int j = 1; j <= n; j += i) {\n        sum += i * j;\n    }\n}",
                        "cpp",
                        "O(n log n)",
                        "O(n);O(n log n);O(n^2);O(n^2 log n)",
                        "The inner loop runs n/i times for each i. Summing this over all i from 1 to n gives the harmonic series: n/1 + n/2 + n/3 + ... + n/n = n * (1/1 + 1/2 + ... + 1/n) = n * ln(n), which is O(n log n)."
                    ), "Hard")
                };

                foreach (var q in questions)
                {
                    db.GameQuestions.Add(new GameQuestion
                    {
                        GameId = complexityGame.Id,
                        Content = q.ContentJson,
                        Difficulty = q.Difficulty
                    });
                }
                await db.SaveChangesAsync();
            }

            // 3. Seed Debug the Code Questions
            if (debugGame != null && !await db.GameQuestions.AnyAsync(q => q.GameId == debugGame.Id))
            {
                var questions = new List<(string ContentJson, string Difficulty)>
                {
                    (CreateContentJson(
                        "def find_max(arr):\n    max_val = 0 # Bug here\n    for x in arr:\n        if x > max_val:\n            max_val = x\n    return max_val",
                        "python",
                        "max_val should be initialized to arr[0] or -infinity",
                        "max_val should be initialized to arr[0] or -infinity;loop should start from index 1;if condition should be x >= max_val;no bug in this function",
                        "If the array contains only negative numbers (e.g. [-5, -2, -10]), initializing max_val to 0 will incorrectly return 0 as the maximum value. It should be initialized to arr[0] or a very small number like negative infinity."
                    ), "Easy"),
                    (CreateContentJson(
                        "int sum_of_evens(int n) {\n    int sum = 0;\n    for (int i = 1; i <= n; i++) {\n        if (i % 2 == 0) // Bug: no brackets/addition\n        sum += 1;\n    }\n    return sum;\n}",
                        "cpp",
                        "sum += 1 increments count of evens, not their sum (should be sum += i)",
                        "loop should go up to n-1;if condition should check remainder as 1;sum += 1 increments count of evens, not their sum (should be sum += i);no bug in C++ code snippet",
                        "The variable sum is supposed to store the sum of even numbers. By doing `sum += 1`, it only increments by 1 (counting the even numbers instead of summing them up). It should be `sum += i;`."
                    ), "Medium"),
                    (CreateContentJson(
                        "public static int binarySearch(int[] arr, int target) {\n    int l = 0, r = arr.length;\n    while (l < r) {\n        int mid = (l + r) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) l = mid; // Bug: infinite loop if target is not present\n        else r = mid;\n    }\n    return -1;\n}",
                        "java",
                        "l should be set to mid + 1 to guarantee progress",
                        "r should be initialized to arr.length - 1;l should be set to mid + 1 to guarantee progress;mid calculation should be (l - r) / 2;r should be set to mid - 1",
                        "Setting `l = mid` when `arr[mid] < target` can cause an infinite loop because `l` and `mid` can stay identical (due to integer division truncating). It should be `l = mid + 1;`."
                    ), "Hard")
                };

                foreach (var q in questions)
                {
                    db.GameQuestions.Add(new GameQuestion
                    {
                        GameId = debugGame.Id,
                        Content = q.ContentJson,
                        Difficulty = q.Difficulty
                    });
                }
                await db.SaveChangesAsync();
            }
        }

        private static string CreateContentJson(string codeSnippet, string language, string correctAnswer, string optionsRaw, string explanation)
        {
            var dict = new Dictionary<string, string>
            {
                { "codeSnippet", codeSnippet },
                { "language", language },
                { "correctAnswer", correctAnswer },
                { "optionsRaw", optionsRaw },
                { "explanation", explanation }
            };
            return JsonSerializer.Serialize(dict);
        }
    }
}
