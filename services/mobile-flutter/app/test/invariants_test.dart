import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

// Client invariant suite for the Flutter golden client.
//
// These are source-scanning tests: they read every Dart file under lib/ and
// assert that no secret material is embedded and that the auth token only ever
// lives in the platform secure store. They need no widget pump, so they run as
// plain flutter_test cases and pass in CI without a device or emulator.

/// All Dart source files under app/lib, regardless of test working directory.
List<File> _libDartFiles() {
  // `flutter test` runs with the package root (app/) as cwd, so lib/ resolves.
  final libDir = Directory('lib');
  expect(libDir.existsSync(), isTrue, reason: 'lib/ must exist next to test/');
  return libDir
      .listSync(recursive: true)
      .whereType<File>()
      .where((f) => f.path.endsWith('.dart'))
      .toList();
}

String _allLibSource() => _libDartFiles().map((f) => f.readAsStringSync()).join('\n');

void main() {
  group('client invariants', () {
    // C-1: no secret in app source. Only build-time / public config is allowed
    // client-side. Assert no hard-coded secret-shaped assignments appear.
    test('C-1: no secret literal embedded in app source', () {
      final src = _allLibSource();
      final secretAssign = RegExp(
        r'''(secret|password|passwd|private[_-]?key|client[_-]?secret)\s*[:=]\s*['"][^'"]{6,}['"]''',
        caseSensitive: false,
      );
      final matches = secretAssign.allMatches(src).map((m) => m.group(0)).toList();
      expect(matches, isEmpty,
          reason: 'Secret-shaped literal found in lib/: $matches. '
              'Client may only use build-time/public config.');
    });

    // C-3: no third-party API key embedded in source. Catch common vendor key
    // prefixes (Google, Stripe, AWS, Slack, GitHub, generic sk-/api keys).
    test('C-3: no third-party API key embedded in source', () {
      final src = _allLibSource();
      final keyPatterns = <RegExp>[
        RegExp(r'AIza[0-9A-Za-z\-_]{20,}'), // Google API key
        RegExp(r'sk_(live|test)_[0-9A-Za-z]{16,}'), // Stripe secret key
        RegExp(r'AKIA[0-9A-Z]{16}'), // AWS access key id
        RegExp(r'xox[baprs]-[0-9A-Za-z\-]{10,}'), // Slack token
        RegExp(r'gh[pousr]_[0-9A-Za-z]{30,}'), // GitHub token
        RegExp(r'''api[_-]?key\s*[:=]\s*['"][0-9A-Za-z\-_]{16,}['"]''',
            caseSensitive: false), // generic api_key = "..."
      ];
      final hits = <String>[];
      for (final p in keyPatterns) {
        hits.addAll(p.allMatches(src).map((m) => m.group(0)!));
      }
      expect(hits, isEmpty,
          reason: 'Third-party API key pattern found in lib/: $hits');
    });

    // C-4: the auth token is stored in flutter_secure_storage (Keychain on iOS,
    // Keystore on Android) — never SharedPreferences, never plaintext.
    test('C-4: auth token uses flutter_secure_storage, not SharedPreferences',
        () {
      final src = _allLibSource();

      // The secure storage helper must be present and used for the token.
      expect(src.contains('FlutterSecureStorage'), isTrue,
          reason: 'Token storage must use FlutterSecureStorage.');
      expect(src.contains('flutter_secure_storage'), isTrue,
          reason: 'lib/ must import package:flutter_secure_storage.');

      // The token writer/reader must go through the secure store API.
      final usesSecureWrite = RegExp(r'_storage\.write|\.write\(\s*key:').hasMatch(src);
      final usesSecureRead = RegExp(r'_storage\.read|\.read\(\s*key:').hasMatch(src);
      expect(usesSecureWrite && usesSecureRead, isTrue,
          reason: 'saveToken/readToken must use the secure storage read/write API.');

      // Insecure stores are forbidden anywhere in client source.
      //
      // Note: FlutterSecureStorage's AndroidOptions(encryptedSharedPreferences:
      // true) is the SECURE Keystore-backed path, not the plaintext
      // SharedPreferences API. Strip that token before checking so the secure
      // option does not trip the plaintext-store guard.
      final withoutSecureOption =
          src.replaceAll('encryptedSharedPreferences', '');
      expect(withoutSecureOption.contains('SharedPreferences'), isFalse,
          reason: 'Auth token must never touch the plaintext SharedPreferences API.');
      expect(src.contains('shared_preferences'), isFalse,
          reason: 'shared_preferences package must not be used for the token.');
    });

    // M-1: no API secret in the app source/bundle. Mobile-specific: the client
    // must not embed a bearer/API secret that ships inside the installed app.
    test('M-1: no API secret embedded in the app source/bundle', () {
      final src = _allLibSource();
      final apiSecret = RegExp(
        r'''(bearer\s+[A-Za-z0-9\-_.]{20,}|api[_-]?secret\s*[:=]\s*['"][^'"]{8,}['"]|authorization\s*[:=]\s*['"]bearer[^'"]+['"])''',
        caseSensitive: false,
      );
      final hits = apiSecret.allMatches(src).map((m) => m.group(0)).toList();
      expect(hits, isEmpty,
          reason: 'Hard-coded API secret found in app source: $hits');
    });
  });
}
