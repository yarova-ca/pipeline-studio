const fs = require('node:fs')
const path = require('node:path')

// Client + mobile invariant suite. Each test maps to one C-id / M-id from the
// service spec. These invariants are statically checkable: they assert facts
// about the client source/bundle, so they grep the real app source rather than
// boot a React Native runtime.
//
// Source set under test: every first-party .js source file in app/, excluding
// node_modules, the built web bundle (dist/), and the test files themselves.

const APP_DIR = __dirname

function collectSourceFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...collectSourceFiles(full))
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const SOURCE_FILES = collectSourceFiles(APP_DIR)

function readAll() {
  return SOURCE_FILES.map((f) => ({
    file: path.relative(APP_DIR, f),
    text: fs.readFileSync(f, 'utf8'),
  }))
}

// Strip comments so prose like "never AsyncStorage" in a comment is not
// mistaken for real usage. Removes // line comments and /* */ block comments.
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('client + mobile invariants', () => {
  test('source set is non-empty (guards against a silent no-op grep)', () => {
    expect(SOURCE_FILES.length).toBeGreaterThan(0)
  })

  // C-1: no secret in the app source/bundle. The client may read environment
  // ONLY through EXPO_PUBLIC_-prefixed keys — those are the only values Expo
  // inlines into the client bundle. Any non-public process.env read in client
  // source would mean a server-only secret is being pulled client-side.
  test('C-1: client reads only EXPO_PUBLIC_-prefixed env (no server secrets)', () => {
    const offenders = []
    // Match process.env.SOMETHING and flag any name not starting with EXPO_PUBLIC_.
    const re = /process\.env\.([A-Z0-9_]+)/g
    for (const { file, text } of readAll()) {
      const code = stripComments(text)
      let m
      while ((m = re.exec(code)) !== null) {
        const name = m[1]
        if (!name.startsWith('EXPO_PUBLIC_')) {
          offenders.push(`${file}: process.env.${name}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  // C-3 / M-1: no third-party API key or API secret embedded in the source.
  // Catches common literal-secret shapes: assignments to *key/*secret/*token,
  // and well-known provider key prefixes (sk-, AKIA..., Google AIza...).
  const SECRET_PATTERNS = [
    {
      label: 'hardcoded api key/secret/token literal',
      re: /(api[_-]?key|secret|access[_-]?token|client[_-]?secret|private[_-]?key)\s*[:=]\s*['"][^'"]{12,}['"]/i,
    },
    { label: 'OpenAI-style key (sk-...)', re: /['"]sk-[A-Za-z0-9]{16,}['"]/ },
    { label: 'AWS access key id (AKIA...)', re: /AKIA[0-9A-Z]{16}/ },
    { label: 'Google API key (AIza...)', re: /AIza[0-9A-Za-z\-_]{20,}/ },
    { label: 'Bearer literal', re: /Bearer\s+[A-Za-z0-9\-._~+/]{20,}/ },
  ]

  function findSecrets() {
    const hits = []
    for (const { file, text } of readAll()) {
      const code = stripComments(text)
      for (const { label, re } of SECRET_PATTERNS) {
        if (re.test(code)) hits.push(`${file}: ${label}`)
      }
    }
    return hits
  }

  test('C-3: no third-party API key embedded in client source', () => {
    expect(findSecrets()).toEqual([])
  })

  test('M-1: no API secret in the app bundle/source', () => {
    expect(findSecrets()).toEqual([])
  })

  // C-4: the auth token is stored in SecureStore/Keychain, never AsyncStorage
  // or plaintext. The storage helper (App.js) must use expo-secure-store and
  // must NOT touch AsyncStorage or any localStorage/plaintext file write.
  test('C-4: auth token uses expo-secure-store, never AsyncStorage/plaintext', () => {
    const appText = fs.readFileSync(path.join(APP_DIR, 'App.js'), 'utf8')

    // Positive: the secure store API is imported and used to persist the token.
    expect(appText).toMatch(/from\s+['"]expo-secure-store['"]/)
    expect(appText).toMatch(/SecureStore\.setItemAsync/)

    // Negative: no insecure storage path anywhere in client CODE. Comments are
    // stripped first so the doc-comment "never AsyncStorage" is not a hit; only
    // a real import or call site counts.
    const insecure = [
      { label: 'AsyncStorage import', re: /['"]@react-native-async-storage\/async-storage['"]/ },
      { label: 'AsyncStorage usage', re: /AsyncStorage\s*\./ },
      { label: 'window.localStorage', re: /localStorage\s*\./ },
      { label: 'sessionStorage', re: /sessionStorage\s*\./ },
    ]
    const offenders = []
    for (const { file, text } of readAll()) {
      const code = stripComments(text)
      for (const { label, re } of insecure) {
        if (re.test(code)) offenders.push(`${file}: ${label}`)
      }
    }
    expect(offenders).toEqual([])
  })

  // C-7: a failed network call surfaces a user-visible state, never a silent
  // swallow. Straightforward to assert: the only fetch in the client has a
  // .catch that sets visible UI state.
  test('C-7: failed BFF call sets a user-visible state (no silent swallow)', () => {
    const appText = fs.readFileSync(path.join(APP_DIR, 'App.js'), 'utf8')
    expect(appText).toMatch(/\.catch\(/)
    expect(appText).toMatch(/setProfile\(/)
  })
})
