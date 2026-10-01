using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;
using Serilog;

namespace ThanaweyaAmma.App.Services
{
    public class SecureCredentials
    {
        public string GeminiApiKey { get; set; } = string.Empty;
        public string GroqApiKey { get; set; } = string.Empty;
        public string SupabaseUrl { get; set; } = "https://your-project.supabase.co";
        public string SupabaseAnonKey { get; set; } = string.Empty;
        public DateTime LastRotatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Enterprise App Configuration using Windows Data Protection API (DPAPI)
    /// to securely encrypt/decrypt rotated API keys and credentials at rest.
    /// </summary>
    public class AppConfig
    {
        private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("ThanaweyaAmma_MathSection_2026_Entropy");
        private readonly string _storageFilePath;
        private SecureCredentials _cachedCredentials;

        public SecureCredentials Credentials => _cachedCredentials;

        public AppConfig(string? customPath = null)
        {
            var appDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ThanaweyaAmmaMathCopilot");

            Directory.CreateDirectory(appDataFolder);
            _storageFilePath = customPath ?? Path.Combine(appDataFolder, "vault.secure");
            _cachedCredentials = LoadOrInitializeCredentials();
        }

        private SecureCredentials LoadOrInitializeCredentials()
        {
            try
            {
                if (File.Exists(_storageFilePath))
                {
                    byte[] encryptedBytes = File.ReadAllBytes(_storageFilePath);
                    byte[] decryptedBytes = ProtectedData.Unprotect(
                        encryptedBytes,
                        Entropy,
                        DataProtectionScope.CurrentUser);

                    string json = Encoding.UTF8.GetString(decryptedBytes);
                    var creds = JsonConvert.DeserializeObject<SecureCredentials>(json);
                    if (creds != null)
                    {
                        Log.Information("[AppConfig] Secure credentials loaded and decrypted successfully via DPAPI.");
                        return creds;
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "[AppConfig] Unable to decrypt credentials using DPAPI, initializing fallback from environment variables.");
            }

            // Fallback from environment variables if vault doesn't exist yet
            var initialCreds = new SecureCredentials
            {
                GeminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? string.Empty,
                GroqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? string.Empty,
                SupabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL") ?? "https://xyzcompany.supabase.co",
                SupabaseAnonKey = Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY") ?? string.Empty,
                LastRotatedAt = DateTime.UtcNow
            };

            SaveCredentials(initialCreds);
            return initialCreds;
        }

        public void SaveCredentials(SecureCredentials credentials)
        {
            try
            {
                credentials.LastRotatedAt = DateTime.UtcNow;
                string json = JsonConvert.SerializeObject(credentials, Formatting.Indented);
                byte[] plaintextBytes = Encoding.UTF8.GetBytes(json);

                // Encrypt using DPAPI bound to CurrentUser
                byte[] encryptedBytes = ProtectedData.Protect(
                    plaintextBytes,
                    Entropy,
                    DataProtectionScope.CurrentUser);

                File.WriteAllBytes(_storageFilePath, encryptedBytes);
                _cachedCredentials = credentials;
                Log.Information("[AppConfig] Secure credentials encrypted via DPAPI and persisted to vault: {Path}", _storageFilePath);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AppConfig] Failed to encrypt credentials via DPAPI.");
                throw;
            }
        }

        public void RotateApiKeys(string newGeminiKey, string newGroqKey, string? newSupabaseKey = null)
        {
            Log.Information("[AppConfig] Rotating API credentials at runtime...");
            var updated = new SecureCredentials
            {
                GeminiApiKey = !string.IsNullOrWhiteSpace(newGeminiKey) ? newGeminiKey : _cachedCredentials.GeminiApiKey,
                GroqApiKey = !string.IsNullOrWhiteSpace(newGroqKey) ? newGroqKey : _cachedCredentials.GroqApiKey,
                SupabaseUrl = _cachedCredentials.SupabaseUrl,
                SupabaseAnonKey = !string.IsNullOrWhiteSpace(newSupabaseKey) ? newSupabaseKey : _cachedCredentials.SupabaseAnonKey,
                LastRotatedAt = DateTime.UtcNow
            };

            SaveCredentials(updated);
            Log.Information("[AppConfig] Key rotation complete. Timestamp: {Timestamp}", updated.LastRotatedAt);
        }
    }
}
