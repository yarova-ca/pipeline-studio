<?php

namespace App\Controller;

use App\Entity\Item;
use App\Repository\ItemRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

#[Route('/users/me/items')]
class UserItemController extends AbstractController
{
    public function __construct(
        private readonly ItemRepository $itemRepository,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
    ) {}

    /** GET /users/me/items */
    #[Route('', methods: ['GET'])]
    public function list(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) return $this->json(['error' => 'Unauthorized'], 401);
        return $this->json($this->itemRepository->findByUserId($user->getId()));
    }

    /** POST /users/me/items */
    #[Route('', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) return $this->json(['error' => 'Unauthorized'], 401);

        $body  = json_decode($request->getContent(), true) ?? [];
        $title = trim($body['title'] ?? '');
        if ($title === '') {
            return $this->json(['error' => 'title is required'], 400);
        }

        $item = new Item($title, $body['description'] ?? null, $user);
        $this->em->persist($item);
        $this->em->flush();

        return $this->json($item, 201);
    }

    /** GET /users/me/items/{id} */
    #[Route('/{id}', methods: ['GET'])]
    public function show(string $id, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) return $this->json(['error' => 'Unauthorized'], 401);
        $item = $this->itemRepository->findByIdAndUserId($id, $user->getId());
        return $item ? $this->json($item) : $this->json(['error' => 'Item not found'], 404);
    }

    /** PUT /users/me/items/{id} */
    #[Route('/{id}', methods: ['PUT'])]
    public function update(string $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) return $this->json(['error' => 'Unauthorized'], 401);
        $item = $this->itemRepository->findByIdAndUserId($id, $user->getId());
        if ($item === null) return $this->json(['error' => 'Item not found'], 404);

        $body = json_decode($request->getContent(), true) ?? [];
        if (!empty(trim($body['title'] ?? ''))) $item->setTitle(trim($body['title']));
        if (array_key_exists('description', $body)) $item->setDescription($body['description']);

        $this->em->flush();
        return $this->json($item);
    }

    /** DELETE /users/me/items/{id} */
    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(string $id, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) return $this->json(['error' => 'Unauthorized'], 401);
        $item = $this->itemRepository->findByIdAndUserId($id, $user->getId());
        if ($item === null) return $this->json(['error' => 'Item not found'], 404);
        $this->em->remove($item);
        $this->em->flush();
        return $this->json(null, 204);
    }
}
