<?php

namespace App\Http\Controllers;

use App\Models\Player;
use Illuminate\Http\Request;

class PlayerController extends Controller
{

public function index()
{
    return Player::all();
}

public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string',
        'position' => 'nullable|string',
        'age' => 'nullable|integer',
        'team' => 'nullable|string',
    ]);
    return Player::create($validated);
}

public function show(Player $player)
{
    return $player;
}

public function update(Request $request, Player $player)
{
    $player->update($request->all());
    return $player;
}

public function destroy(Player $player)
{
    $player->delete();
    return response()->json(['message' => 'Deleted']);
}
}
