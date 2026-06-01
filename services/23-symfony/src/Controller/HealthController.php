<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class HealthController extends AbstractController
{
    #[Route('/', name: 'hello', methods: ['GET'])]
    public function hello(): JsonResponse
    {
        return $this->json(['message' => 'Hello from Symfony 7.2', 'framework' => '23-symfony', 'version' => '1.0.0']);
    }

    #[Route('/health', name: 'health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return $this->json(['status' => 'ok', 'version' => '1.0.0']);
    }

    #[Route('/health/live', name: 'liveness', methods: ['GET'])]
    public function liveness(): JsonResponse
    {
        return $this->json(['status' => 'ok']);
    }

    #[Route('/health/ready', name: 'readiness', methods: ['GET'])]
    public function readiness(): JsonResponse
    {
        return $this->json(['status' => 'ok']);
    }
}
