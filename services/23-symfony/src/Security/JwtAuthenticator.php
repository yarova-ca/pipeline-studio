<?php

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

/**
 * JwtAuthenticator — resolves the authenticated user from:
 * 1. Authorization: Bearer <JWT> — decoded via LexikJWT.
 * 2. X-API-Key header            — DB lookup.
 */
class JwtAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
    ) {}

    public function supports(Request $request): ?bool
    {
        return $request->headers->has('Authorization')
            || $request->headers->has('X-API-Key');
    }

    public function authenticate(Request $request): Passport
    {
        // Attempt 1: Bearer JWT.
        $auth = $request->headers->get('Authorization', '');
        if (str_starts_with($auth, 'Bearer ')) {
            $token = substr($auth, 7);
            try {
                $payload = $this->jwtManager->parse($token);
            } catch (\Exception) {
                throw new CustomUserMessageAuthenticationException('Invalid JWT token.');
            }

            $userId = $payload['sub'] ?? null;
            if (!$userId) throw new CustomUserMessageAuthenticationException('Invalid JWT claims.');

            return new SelfValidatingPassport(new UserBadge(
                $userId,
                fn(string $id) => $this->userRepository->find($id)
                    ?? throw new CustomUserMessageAuthenticationException('User not found.')
            ));
        }

        // Attempt 2: X-API-Key header.
        $apiKey = $request->headers->get('X-API-Key');
        if ($apiKey) {
            return new SelfValidatingPassport(new UserBadge(
                $apiKey,
                fn(string $key) => $this->userRepository->findOneBy(['apiKey' => $key])
                    ?? throw new CustomUserMessageAuthenticationException('Invalid API key.')
            ));
        }

        throw new CustomUserMessageAuthenticationException('No authentication credentials provided.');
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null; // Continue to the controller.
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(['error' => $exception->getMessageKey()], Response::HTTP_UNAUTHORIZED);
    }
}
