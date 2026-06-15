import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// M-1 / C-4: the access token lives in the platform secure store — Keychain on
// iOS, Keystore on Android. Never SharedPreferences, never plaintext.
const _storage = FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
);

Future<void> saveToken(String token) => _storage.write(key: 'access_token', value: token);
Future<String?> readToken() => _storage.read(key: 'access_token');

void main() {
  runApp(const YarovaApp());
}

class YarovaApp extends StatelessWidget {
  const YarovaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(title: 'Yarova', home: HomePage());
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _profile = '…';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      // C-3: the client calls only its own origin; on web the static server
      // proxies /compliance to the BFF. No third-party key is embedded.
      final res = await http.get(Uri.base.resolve('/compliance'));
      if (res.statusCode == 200) {
        setState(() => _profile = (jsonDecode(res.body)['profile'] as String?) ?? 'unknown');
      } else {
        setState(() => _profile = 'unavailable — retry'); // C-7: visible state
      }
    } catch (_) {
      setState(() => _profile = 'unavailable — retry');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Yarova — Flutter golden client',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text('Active industry profile (via BFF): $_profile'),
          ],
        ),
      ),
    );
  }
}
