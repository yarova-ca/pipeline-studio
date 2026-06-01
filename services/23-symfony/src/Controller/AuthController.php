<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {}

    /** GET /auth/login — redirect to GitHub OAuth. */
    #[Route('/login', methods: ['GET'])]
    public function login(Request $request): Response
    {
        $clientId    = $_ENV['GITHUB_CLIENT_ID']    ?? '';
        $redirectUri = $_ENV['GITHUB_REDIRECT_URI'] ?? '';
        $url = 'https://github.com/login/oauth/authorize'
             . '?client_id=' . urlencode($clientId)
             . '&redirect_uri=' . urlencode($redirectUri)
             . '&scope=user:email';
        return $this->redirect($url);
    }

    /** GET /auth/callback — exchange code, upsert user, return JWT. */
    #[Route('/callback', methods: ['GET'])]
    public function callback(Request $request): JsonResponse
    {
        $code = $request->query->get('code');
        if (empty($code)) {
            return $this->json(['error' => 'Missing code'], 400);
        }

        // Exchange code for access token.
        $ch = curl_init('https://github.com/login/oauth/access_token');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'client_id'     => $_ENV['GITHUB_CLIENT_ID']     ?? '',
                'client_secret' => $_ENV['GITHUB_CLIENT_SECRET'] ?? '',
                'code'          => $code,
            ]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        ]);
        $tokenBody = json_decode(curl_exec($ch), true) ?? [];
        curl_close($ch);

        $accessToken = $tokenBody['access_token'] ?? null;
        if (empty($accessToken)) {
            return $this->json(['error' => 'GitHub token exchange failed'], 401);
        }

        // Fetch GitHub user.
        $ch = curl_init('https://api.github.com/user');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Authorization: Bearer $accessToken",
                'Accept: application/json',
                'User-Agent: symfony-app',
            ],
        ]);
        $profile = json_decode(curl_exec($ch), true) ?? null;
        curl_close($ch);

        if ($profile === null) {
            return $this->json(['error' => 'GitHub profile fetch failed'], 401);
        }

        $email = $profile['email'] ?? ($profile['login'] . '@github.noemail');
        $name  = $profile['name']  ?? $profile['login'];

        // Upsert user.
        $user = $this->userRepository->findOneBy(['email' => $email]);
        if ($user === null) {
            $user = new User($email, $name, 'github');
            $this->em->persist($user);
        } else {
            $user->setName($name);
        }
        $this->em->flush();

        $token = $this->jwtManager->createFromPayload($user, [
            'sub'   => $user->getId(),
            'email' => $user->getEmail(),
            'name'  => $user->getName(),
        ]);
        return $this->json(['token' => $token]);
    }

    /** GET /auth/me — return current user (authenticated). */
    #[Route('/me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) return $this->json(['error' => 'Unauthorized'], 401);
        return $this->json([
            'id'    => $user->getId(),
            'email' => $user->getEmail(),
            'name'  => $user->getName(),
        ]);
    }

    /** POST /auth/logout — stateless JWT. */
    #[Route('/logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        return $this->json(['status' => 'ok']);
    }

    /** POST /auth/api-key — generate and save API key. */
    #[Route('/api-key', methods: ['POST'])]
    public function generateApiKey(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) return $this->json(['error' => 'Unauthorized'], 401);
        $key = bin2hex(random_bytes(32));
        $user->setApiKey($key);
        $this->em->flush();
        return $this->json(['api_key' => $key]);
    }

    /** DELETE /auth/api-key — revoke API key. */
    #[Route('/api-key', methods: ['DELETE'])]
    public function revokeApiKey(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) return $this->json(['error' => 'Unauthorized'], 401);
        $user->setApiKey(null);
        $this->em->flush();
        return $this->json(['status' => 'ok']);
    }

    /** POST /dev/token — dev-only JWT without OAuth. */
    #[Route('/dev/token', methods: ['POST'])]
    public function devToken(Request $request): JsonResponse
    {
        $env = $_ENV['APP_ENV'] ?? 'dev';
        if ($env === 'prod') {
            return $this->json(['error' => 'Not available'], 403);
        }

        $body  = json_decode($request->getContent(), true) ?? [];
        $email = $body['email'] ?? 'dev@example.com';
        $name  = $body['name']  ?? 'Dev User';

        $user = $this->userRepository->findOneBy(['email' => $email]);
        if ($user === null) {
            $user = new User($email, $name, 'dev');
            $this->em->persist($user);
            $this->em->flush();
        }

        $token = $this->jwtManager->createFromPayload($user, [
            'sub'   => $user->getId(),
            'email' => $user->getEmail(),
            'name'  => $user->getName(),
        ]);
        return $this->json(['token' => $token]);
    }
}
