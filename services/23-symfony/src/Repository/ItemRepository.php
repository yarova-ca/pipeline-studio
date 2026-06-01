<?php

namespace App\Repository;

use App\Entity\Item;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Item::class);
    }

    /** @return Item[] */
    public function findByUserId(string $userId): array
    {
        return $this->createQueryBuilder('i')
            ->where('i.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByIdAndUserId(string $id, string $userId): ?Item
    {
        return $this->createQueryBuilder('i')
            ->where('i.id = :id AND i.user = :userId')
            ->setParameter('id', $id)
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
