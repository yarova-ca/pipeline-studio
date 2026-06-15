<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Item;

class UserItemController extends Controller
{
    // GET /users/me/items
    public function index(): JsonResponse
    {
        $items = auth()->user()
            ->items()
            ->orderByDesc('created_at')
            ->get();

        return response()->json($items);
    }

    // POST /users/me/items
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $item = auth()->user()->items()->create($data);

        return response()->json($item, 201);
    }

    // GET /users/me/items/{id}
    public function show(int $id): JsonResponse
    {
        $item = auth()->user()->items()->find($id);

        if ($item === null) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($item);
    }

    // PUT /users/me/items/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $item = auth()->user()->items()->find($id);

        if ($item === null) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $data = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $item->update($data);

        return response()->json($item);
    }

    // DELETE /users/me/items/{id}
    public function destroy(int $id): \Illuminate\Http\Response
    {
        $item = auth()->user()->items()->find($id);

        if ($item === null) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $item->delete();

        return response()->noContent();
    }
}
