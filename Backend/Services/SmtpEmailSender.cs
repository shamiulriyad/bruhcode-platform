using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace Backend.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly string _host;
        private readonly int _port;
        private readonly bool _useStartTls;
        private readonly string? _username;
        private readonly string? _password;
        private readonly string _fromAddress;

        public SmtpEmailSender(IConfiguration config)
        {
            _config = config;
            _host = _config["Smtp:Host"] ?? System.Environment.GetEnvironmentVariable("SMTP_HOST") ?? "localhost";
            _port = int.TryParse(_config["Smtp:Port"] ?? System.Environment.GetEnvironmentVariable("SMTP_PORT"), out var p) ? p : 587;
            _useStartTls = bool.TryParse(_config["Smtp:EnableSsl"] ?? System.Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL"), out var s) ? s : true;
            _username = _config["Smtp:Username"] ?? System.Environment.GetEnvironmentVariable("SMTP_USERNAME");
            _password = _config["Smtp:Password"] ?? System.Environment.GetEnvironmentVariable("SMTP_PASSWORD");
            _fromAddress = _config["Smtp:From"] ?? System.Environment.GetEnvironmentVariable("SMTP_FROM") ?? "no-reply@example.com";
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_fromAddress));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            message.Body = new TextPart("plain") { Text = body };

            using var client = new SmtpClient();
            try
            {
                if (_useStartTls)
                {
                    await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTlsWhenAvailable);
                }
                else
                {
                    await client.ConnectAsync(_host, _port, SecureSocketOptions.Auto);
                }

                if (!string.IsNullOrEmpty(_username))
                {
                    await client.AuthenticateAsync(_username, _password ?? string.Empty);
                }

                await client.SendAsync(message);
            }
            finally
            {
                try { await client.DisconnectAsync(true); } catch { }
            }
        }
    }
}
