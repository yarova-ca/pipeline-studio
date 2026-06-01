<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
class User
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid')]
    private string $id;

    #[ORM\Column(unique: true)]
    private string $email;

    #[ORM\Column]
    private string $name;

    #[ORM\Column(name: 'api_key', nullable: true, unique: true)]
    private ?string $apiKey = null;

    #[ORM\Column]
    private string $provider;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Item::class, cascade: ['remove'])]
    private Collection $items;

    public function __construct(string $email, string $name, string $provider)
    {
        $this->id        = \Symfony\Component\Uid\Uuid::v4()->toRfc4122();
        $this->email     = $email;
        $this->name      = $name;
        $this->provider  = $provider;
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->items     = new ArrayCollection();
    }

    #[ORM\PreUpdate]
    public function onUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): string        { return $this->id; }
    public function getEmail(): string     { return $this->email; }
    public function getName(): string      { return $this->name; }
    public function setName(string $n): void { $this->name = $n; }
    public function getApiKey(): ?string   { return $this->apiKey; }
    public function setApiKey(?string $k): void { $this->apiKey = $k; }
    public function getProvider(): string  { return $this->provider; }
    public function getItems(): Collection { return $this->items; }
}
