package com.example.auth

import java.util.UUID

/** Principal stored in the SecurityContext after authentication. */
data class AuthenticatedUser(
    val id: UUID,
    val email: String,
    val name: String,
)
