<?php

namespace App\Http\Controllers;

use App\Support\Metrics;
use Illuminate\Http\Response;

class MetricsController extends Controller
{
    // I-13: Prometheus scrape endpoint.
    public function index(): Response
    {
        return response(Metrics::render(), 200)
            ->header('Content-Type', 'text/plain; version=0.0.4');
    }
}
