<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Faker\Factory as FakerFactory;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $faker = FakerFactory::create();

        $maxUserId = DB::table('users')->max('id') ?? 0;
        $nextUserId = $maxUserId + 1;

        $maxGalleryId = DB::table('gallery')->max('id') ?? 0;
        $nextGalleryId = $maxGalleryId + 1;

        $countries = ['Tunisia', 'France', 'Morocco', 'Algeria', 'Qatar'];
        $genders = ['male', 'female'];

        $totalToCreate = 60;

        for ($i = 0; $i < $totalToCreate; $i++) {
            $userId = $nextUserId + $i;

            $isComplete = $faker->boolean(65);

            $data = [
                'id' => $userId,
                'uuid' => (string) Str::uuid(),
                'first_name' => $faker->firstName(),
                'last_name' => $faker->lastName(),
                'email' => $faker->unique()->safeEmail(),
                'password' => bcrypt('password123'),
                'status' => 'active',
                'role' => 'talent',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if ($isComplete) {
                // On réserve l'id gallery qui sera créé juste après pour cet user
                $galleryIdForThisUser = $nextGalleryId;

                $data = array_merge($data, [
                    'reference' => $faker->unique()->numberBetween(100000, 999999),
                    'last_login' => now(),
                    'gallery_id' => $galleryIdForThisUser,
                    'full_name_en' => $data['first_name'].' '.$data['last_name'],
                    'country' => $faker->randomElement($countries),
                    'state' => $faker->state(),
                    'city' => $faker->city(),
                    'address' => $faker->streetAddress(),
                    'nationality' => $faker->randomElement($countries),
                    'phone_number' => $faker->phoneNumber(),
                    'birthday' => $faker->date('Y-m-d', '2005-01-01'),
                    'gender' => $faker->randomElement($genders),
                    'weight' => $faker->randomFloat(2, 50, 100),
                    'height' => $faker->randomFloat(2, 150, 200),
                    'waist' => $faker->randomFloat(2, 60, 100),
                    'bust' => $faker->randomFloat(2, 70, 110),
                    'hips' => $faker->randomFloat(2, 70, 110),
                    'dress_size' => $faker->numberBetween(34, 48),
                    'shoes' => $faker->numberBetween(36, 45),
                    'chest' => $faker->randomFloat(2, 70, 110),
                    'citizenship' => $faker->randomElement($countries),
                    'bank_account' => $faker->bankAccountNumber(),
                    'card_number' => $faker->creditCardNumber(),
                    'card_expiry_date' => $faker->date('Y-m-d', '2030-01-01'),
                    'billing_address' => $faker->address(),
                    'bank_account_holder_name' => $data['first_name'].' '.$data['last_name'],
                    'bank_name' => $faker->company(),
                    'national_id_number' => $faker->numerify('########'),
                    'national_id_expiry' => $faker->date('Y-m-d', '2030-01-01'),
                    'passport_number' => strtoupper($faker->bothify('P#######')),
                    'passport_expiry' => $faker->date('Y-m-d', '2030-01-01'),
                    'national_id_copy' => json_encode(['path' => 'ids/'.Str::random(10).'.jpg']),
                    'passport_copy' => json_encode(['path' => 'passports/'.Str::random(10).'.jpg']),
                ]);
            }

            DB::table('users')->insert($data);

            // Photo créée pour TOUS les profils complets (cohérence avec gallery_id ci-dessus)
            if ($isComplete) {
                DB::table('gallery')->insert([
                    'id' => $nextGalleryId,
                    'user_id' => $userId,
                    'image_path' => 'avatars/'.Str::random(10).'.jpg',
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $nextGalleryId++;
            }
        }

        $this->command->info("$totalToCreate users créés (mix profils complets/incomplets).");
    }
}
