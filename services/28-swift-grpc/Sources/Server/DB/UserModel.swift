import Foundation

// User model for Swift gRPC service
struct UserRow: Codable {
    let id: String
    let email: String
    let name: String
    let apiKey: String?
    let provider: String
}

struct ItemRow: Codable {
    let id: String
    let title: String
    let description: String?
    let userId: String
}
