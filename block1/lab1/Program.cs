using System.Net;
using System.Net.Sockets;
using System.Text;

namespace Client;

internal class Message
{
    public Message(string text)
    {
        if (text.Contains('|'))
        {
            Timestamp = new DateTime(Convert.ToInt64(text.Split('|')[0]));
            Text = text.Split('|')[1];
        }
        else
        {
            Text = text;
        }
    }

    public string? Text { get; set; }
    public DateTime Timestamp { get; } = DateTime.Now;

    public override string ToString()
    {
        return $"{Timestamp.Ticks}|{Text}";
    }
}

internal class Chat
{
    private List<Message> History { get; } = new();
    
    public void Fetch()
    {
        History.Sort((a, b) => a.Timestamp.CompareTo(b.Timestamp));
        Console.Clear();
        foreach (var message in History)
        {
            Console.WriteLine("[{0}]\t {1}", message.Timestamp.TimeOfDay, message.Text);
        }
    }

    public void NewMessage(Message message)
    {
        if (message.Text!.Equals("/exit"))
        {
            message.Text = "Interlocutor has disconnected. Chat was closed.";
        }
        
        History.Add(message);
        Fetch();
    }
}

class Program
{
    private static async Task Main()
    {
        var chat = new Chat();
        var isUp = true;
        var localAddress = IPAddress.Parse("127.0.0.1");
        string message = "";

        Console.Write("Enter username: ");
        var username = Console.ReadLine();
        if (string.IsNullOrWhiteSpace(username)) return;

        Console.Write("Enter port to send: ");
        if (!int.TryParse(Console.ReadLine(), out var localPort)) return;

        Console.Write("Enter port to receive: ");
        if (!int.TryParse(Console.ReadLine(), out var remotePort)) return;
        Console.Clear();

        // TCP подключение
        var serverEp = new IPEndPoint(localAddress, localPort);
        using Socket listener = new(
            AddressFamily.InterNetwork,
            SocketType.Stream,
            ProtocolType.Tcp);

        listener.Bind(serverEp);
        listener.Listen(100);
        await ConnectToChat();

        // UDP чат
        Task.Run(ReceiveMessageAsync);
        await SendMessageAsync();

        // Отправка сообщений
        async Task ConnectToChat()
        {
            Console.WriteLine("Waiting connection...");

            while (true)
            {
                var clientEp = new IPEndPoint(localAddress, remotePort);

                try
                {
                    using Socket client = new(
                        AddressFamily.InterNetwork,
                        SocketType.Stream,
                        ProtocolType.Tcp);

                    await client.ConnectAsync(clientEp);

                    Console.Clear();
                    break;
                }
                catch
                {
                    // ignored
                }
            }
        }

        async Task SendMessageAsync()
        {
            using var sender = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            while (isUp)
            {
                message = "";
                Console.Write($"{username} > \t");
                
                ConsoleKeyInfo cki;
                cki = Console.ReadKey();
                while (cki.Key != ConsoleKey.Enter)
                {
                    if (cki.Key == ConsoleKey.Backspace)
                    {
                        if (!message.Equals(""))
                        {
                            message = message[..^1];
                        }
                        
                        chat.Fetch();
                        Console.Write($"{username} > \t{message}");
                        
                        cki = Console.ReadKey();
                        continue;
                    }
                    message += cki.KeyChar;
                    cki = Console.ReadKey();
                }
                Console.CursorTop += 1;

                if (string.IsNullOrWhiteSpace(message))
                {
                    chat.Fetch();
                    continue;
                }

                if (message.Equals("/exit"))
                {
                    chat.NewMessage(new Message(message));
                    var exitData = Encoding.UTF8.GetBytes(message);
                    await sender.SendToAsync(exitData, SocketFlags.None, new IPEndPoint(localAddress, remotePort));
                    
                    sender.Close();
                    break;
                }

                message = $"{username}: {message}";
                
                var mes = new Message(message);
                chat.NewMessage(mes);
                
                byte[] data = Encoding.UTF8.GetBytes(mes.ToString());
                await sender.SendToAsync(data, SocketFlags.None, new IPEndPoint(localAddress, remotePort));
            }
        }

        // Прием сообщений
        async Task ReceiveMessageAsync()
        {
            var data = new byte[65535];
            using var receiver = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            receiver.Bind(new IPEndPoint(localAddress, localPort));

            while (true)
            {
                // получаем данные
                var result =
                    await receiver.ReceiveFromAsync(data, SocketFlags.None, new IPEndPoint(localAddress, remotePort));
                var newMessage = Encoding.UTF8.GetString(data, 0, result.ReceivedBytes);
                
                var mes = new Message(newMessage);
                chat.NewMessage(mes);
                
                if (newMessage.Equals("/exit"))
                {
                    isUp = false;
                    
                    receiver.Close();
                    break;
                }

                Console.Write($"{username} > \t{message}");
            }
        }
    }
}