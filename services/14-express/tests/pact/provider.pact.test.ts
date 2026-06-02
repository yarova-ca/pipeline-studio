// Pact contract test — verifies the API matches what consumers expect.
// Pact (consumer-driven contract testing): consumers define expected API shape,
// providers verify their API matches. Catches breaking changes before deployment.
//
// To run: npm run test:pact
// To publish: npm run test:pact -- --publish (requires PACT_BROKER_URL)

import { Verifier } from '@pact-foundation/pact'
import { server } from '../../src/index.js'
import path from 'node:path'

// Mock Prisma for contract tests (same as unit tests)
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    item: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'item-1', title: 'Test item', description: null, userId: 'user-1', createdAt: new Date(), updatedAt: new Date() }
      ]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue({ id: 'item-new', title: 'New item', description: null, userId: 'user-1', createdAt: new Date(), updatedAt: new Date() }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER' }),
      update: jest.fn(),
    },
  })),
}))

describe('Pact Provider Verification', () => {
  afterAll(() => server.close())

  it('verifies all consumer contracts', async () => {
    const opts = {
      provider: '14-express',
      providerBaseUrl: `http://localhost:${process.env.PORT ?? 3000}`,
      // For local development: use pact files in tests/pact/pacts/
      // For CI: set PACT_BROKER_URL to your Pact Broker URL
      pactUrls: [
        path.join(__dirname, 'pacts', 'frontend-14-express.json'),
      ],
      // providerStatesSetupUrl is set when running against a real broker
      logLevel: 'warn' as const,
    }
    await new Verifier(opts).verifyProvider()
  })
})
