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

    // Client-supplied fields allowed on an item write.
    private const ALLOWED_ITEM_FIELDS = ['title', 'description'];

    // POST /users/me/items
    public function store(Request $request): JsonResponse
    {
        if ($reject = $this->rejectUnknownFields($request)) {
            return $reject;
        }

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $item = auth()->user()->items()->create($data);

        return response()->json($item, 201);
    }

    // I-6: 400 when the body carries a field outside ALLOWED_ITEM_FIELDS.
    // Laravel's validate() silently ignores unknown keys, so an explicit
    // strict check is required for "unknown fields rejected" to hold.
    private function rejectUnknownFields(Request $request): ?JsonResponse
    {
        $unknown = array_diff(array_keys($request->all()), self::ALLOWED_ITEM_FIELDS);

        if (count($unknown) > 0) {
            return response()->json(
                ['error' => 'Unknown field(s): ' . implode(', ', $unknown)],
                400,
            );
        }

        return null;
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
