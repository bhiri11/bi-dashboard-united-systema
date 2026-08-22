<?php

use App\Http\Controllers\PlayerController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Players CRUD (protégé par auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('players', PlayerController::class);
});
