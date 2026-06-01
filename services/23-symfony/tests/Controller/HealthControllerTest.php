<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class HealthControllerTest extends WebTestCase
{
    public function test_hello(): void
    {
        $client = static::createClient();
        $client->request('GET', '/');
        $this->assertResponseIsSuccessful();
    }

    public function test_health(): void
    {
        $client = static::createClient();
        $client->request('GET', '/health');
        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals('ok', $data['status']);
    }

    public function test_liveness(): void
    {
        static::createClient()->request('GET', '/health/live');
        $this->assertResponseIsSuccessful();
    }

    public function test_readiness(): void
    {
        static::createClient()->request('GET', '/health/ready');
        $this->assertResponseIsSuccessful();
    }
}
