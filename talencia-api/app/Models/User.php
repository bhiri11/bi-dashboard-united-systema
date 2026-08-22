<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'uuid',
        'reference',
        'first_name',
        'last_name',
        'full_name_en',
        'country',
        'state',
        'city',
        'address',
        'nationality',
        'phone_number',
        'status',
        'additional_info_done',
        'ocr_verified',
        'email',
        'password',
        'role',
        'last_login',
        'gallery_id',
        'birthday',
        'gender',
        'weight',
        'height',
        'waist',
        'bust',
        'hips',
        'dress_size',
        'shoes',
        'chest',
        'citizenship',
        'bank_account',
        'card_number',
        'card_expiry_date',
        'billing_address',
        'bank_account_holder_name',
        'bank_name',
        'national_id_number',
        'national_id_expiry',
        'passport_number',
        'passport_expiry',
        'national_id_copy',
        'passport_copy',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
