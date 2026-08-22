<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class KpiDashboardSeeder extends Seeder
{
    /**
     * Emails utilisés pour identifier les candidats créés par ce seeder
     * (garantit l'idempotence : on saute si déjà présents en base).
     */
    private const USER_EMAIL_PREFIX = 'kpidashboard.user';

    private array $userIds = [];

    private array $jobIds = [];

    private array $projectIds = [];

    private array $professionIds = [];

    public function run(): void
    {
        // Marqueur d'idempotence global : users du seeder déjà présents ?
        $alreadySeeded = User::query()
            ->where('email', 'like', self::USER_EMAIL_PREFIX . '.%@example.com')
            ->exists();

        if ($alreadySeeded) {
            $this->command->warn('⚠️  KpiDashboardSeeder : données déjà présentes, aucune nouvelle insertion.');
            // On re-charge malgré tout les IDs existants pour permettre les vérifications.
            $this->loadExistingUserData();
            return;
        }

        $this->seedCompanies();
        $this->seedProfessions();
        $this->seedUsers();
        $this->seedProjects();
        $this->seedProjectJobs();
        $this->seedApplications();
        $this->seedAttendances();
        $this->seedUserRatings();
        $this->seedTodos();
        $this->seedPenalties();
        $this->seedGalleryImages();

        $this->command->info('✅ KpiDashboardSeeder terminé.');
    }

    private function loadExistingUserData(): void
    {
        $this->userIds = User::query()->pluck('id')->toArray();
        $this->jobIds = DB::table('project_jobs')->pluck('id')->toArray();
        $this->projectIds = DB::table('projects')->pluck('id')->toArray();
        $this->professionIds = DB::table('professions')->pluck('id')->toArray();
    }

    // ------------------------------------------------------------------
    // 1. Companies
    // ------------------------------------------------------------------
    private function seedCompanies(): void
    {
        $companies = [
            'Solusta Events', 'JobBoard Pro', 'StaffLink Qatar', 'EventWorks',
            'TalentHub Global', 'Success Staffing', 'Prime Staff Co',
        ];

        $maxId = DB::table('companies')->max('id') ?? 0;
        $nextId = $maxId + 1;

        foreach ($companies as $i => $name) {
            $existing = DB::table('companies')->where('company_name', $name)->first();

            if ($existing) {
                continue;
            }

            DB::table('companies')->insert([
                'id' => $nextId + $i,
                'company_name' => $name,
                'company_registration_number' => 'REG-' . strtoupper(Str::random(6)),
                'created_at' => Carbon::now()->subMonths(rand(2, 8)),
                'updated_at' => now(),
            ]);
        }
    }

    // ------------------------------------------------------------------
    // 2. Professions
    // ------------------------------------------------------------------
    private function seedProfessions(): void
    {
        $professions = [
            'Software Engineer', 'Mobile Developer', 'UI/UX Designer', 'Project Manager',
            'Graphic Designer', 'Marketing Specialist', 'Event Coordinator', 'Data Analyst',
            'Product Manager', 'QA Tester', 'DevOps Engineer', 'Content Writer',
            'Photographer', 'Video Editor', 'Sales Executive', 'Business Analyst',
        ];

        $maxId = DB::table('professions')->max('id') ?? 0;
        $nextId = $maxId + 1;

        foreach ($professions as $i => $name) {
            $existing = DB::table('professions')->where('name', $name)->first();

            if ($existing) {
                $this->professionIds[] = $existing->id;
                continue;
            }

            DB::table('professions')->insert([
                'id' => $nextId + $i,
                'name' => $name,
                'company_id' => DB::table('companies')->inRandomOrder()->value('id'),
                'created_at' => now()->subDays(rand(10, 90)),
                'updated_at' => now(),
            ]);

            $this->professionIds[] = $nextId + $i;
        }

        // Optionnel : récupère aussi les professions déjà existantes pour les joindre
        $this->professionIds = array_unique(array_merge(
            $this->professionIds,
            DB::table('professions')->pluck('id')->toArray()
        ));
    }

    // ------------------------------------------------------------------
    // 3. Users (candidats/employés)
    // ------------------------------------------------------------------
    private function seedUsers(): void
    {
        $nationalities = [
            'Tunisia', 'France', 'Morocco', 'Algeria', 'Egypt', 'Qatar',
            'United Arab Emirates', 'Spain', 'Turkey', 'Italy', 'Germany', 'United Kingdom',
        ];

        $genders = ['male', 'female'];

        $users = [];

        $maxId = DB::table('users')->max('id') ?? 0;
        $nextId = $maxId + 1;

        for ($i = 1; $i <= 40; $i++) {
            // created_at réparti sur 120 jours pour alimenter les filtres 7/14/30/56
            $createdAt = Carbon::now()->subDays(rand(1, 120))->subHours(rand(0, 23))->subMinutes(rand(0, 59));

            $users[] = [
                'id' => $nextId + $i - 1,
                'uuid' => Str::uuid()->toString(),
                'reference' => rand(10000, 99999),
                'first_name' => $this->fakerName(),
                'last_name' => $this->fakerLastName(),
                'full_name_en' => $this->fakerLastName() . ' ' . $this->fakerLastName(),
                'country' => $nationalities[array_rand($nationalities)],
                'city' => $this->randomCity(),
                'address' => rand(1, 300) . ' Main Street',
                'nationality' => $nationalities[array_rand($nationalities)],
                'phone_number' => '+216' . rand(20000000, 29999999),
                'status' => 'active',
                'additional_info_done' => rand(0, 1),
                'ocr_verified' => rand(0, 1),
                'email' => self::USER_EMAIL_PREFIX . ".{$i}@example.com",
                'email_verified_at' => $createdAt->toDateTimeString(),
                'password' => Hash::make('password'),
                'role' => 'user',
                'last_login' => rand(0, 1) ? Carbon::now()->subDays(rand(0, 10))->toDateTimeString() : null,
                'created_at' => $createdAt->toDateTimeString(),
                'updated_at' => now(),
                'gallery_id' => null,
                'gender' => $genders[array_rand($genders)],
                'citizenship' => $nationalities[array_rand($nationalities)],
            ];
        }

        // Insérer par batch pour éviter les doublons
        foreach ($users as $userData) {
            $user = DB::table('users')->where('email', $userData['email'])->first();
            if (!$user) {
                DB::table('users')->insert($userData);
                $this->userIds[] = (int) $userData['id'];
            } else {
                $this->userIds[] = $user->id;
            }
        }

        // On garde aussi les users existants comme candidats potentiels
        $this->userIds = array_unique(array_merge(
            $this->userIds,
            DB::table('users')->pluck('id')->toArray()
        ));
    }

    // ------------------------------------------------------------------
    // 4. Projects
    // ------------------------------------------------------------------
    private function seedProjects(): void
    {
        $companyIds = DB::table('companies')->pluck('id')->toArray();
        if (empty($companyIds)) {
            $this->command->warn('⚠️ Aucune company, skip projects.');
            return;
        }

        $statuses = ['active', 'active', 'completed', 'closed', 'draft', 'inactive'];
        $currencies = ['EUR', 'QAR', 'USD'];

        $maxId = DB::table('projects')->max('id') ?? 0;
        $nextId = $maxId + 1;

        for ($i = 1; $i <= 12; $i++) {
            $startDate = Carbon::now()->subDays(rand(5, 90));
            $endDate = $startDate->copy()->addDays(rand(15, 60));
            $status = $statuses[array_rand($statuses)];
            $title = "KPI Dashboard Project {$i}";

            $project = DB::table('projects')->where('title', $title)->first();

            if ($project) {
                $this->projectIds[] = $project->id;
                continue;
            }

            $projectId = $nextId + $i - 1;

            DB::table('projects')->insert([
                'id' => $projectId,
                'company_id' => $companyIds[array_rand($companyIds)],
                'title' => $title,
                'supervisor_id' => !empty($this->userIds) ? $this->userIds[array_rand($this->userIds)] : null,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'total_cost' => rand(8000, 85000),
                'currency' => $currencies[array_rand($currencies)],
                'is_total_per_hour' => rand(0, 1),
                'is_total_per_date' => rand(0, 1),
                'status' => $status,
                'created_at' => $startDate,
                'updated_at' => now(),
            ]);

            $this->projectIds[] = $projectId;
        }
    }

    // ------------------------------------------------------------------
    // 5. Project Jobs (postes)
    // ------------------------------------------------------------------
    private function seedProjectJobs(): void
    {
        if (empty($this->projectIds) || empty($this->professionIds)) {
            $this->command->warn('⚠️ Pas de projets ou professions, skip jobs.');
            return;
        }

        $cleanProfessionIds = array_values(array_unique($this->professionIds));

        $maxJobId = DB::table('project_jobs')->max('id') ?? 0;
        $nextJobId = $maxJobId + 1;

        foreach ($this->projectIds as $projectId) {
            $jobCount = rand(2, 4);

            for ($j = 1; $j <= $jobCount; $j++) {
                $professionId = $cleanProfessionIds[array_rand($cleanProfessionIds)];
                $createdAt = Carbon::now()->subDays(rand(5, 80));

                $job = DB::table('project_jobs')->where('project_id', $projectId)
                    ->where('professions_id', $professionId)
                    ->first();

                if ($job) {
                    $this->jobIds[] = $job->id;
                    continue;
                }

                $description = 'Job ' . $j . ' for KPI Dashboard Project #' . $projectId;

                $jobId = $nextJobId;
                $nextJobId++;

                DB::table('project_jobs')->insert([
                    'id' => $jobId,
                    'professions_id' => $professionId,
                    'display_project' => 1,
                    'project_id' => $projectId,
                    'client_id' => null,
                    'top' => rand(0, 1),
                    'description' => $description,
                    'candidates_number' => rand(5, 50),
                    'candidatures_number' => rand(10, 100),
                    'status' => 'published',
                    'is_promoted' => rand(0, 1),
                    'promoted_at' => rand(0, 1) ? now()->subDays(rand(1, 10)) : null,
                    'project_display' => 1,
                    // sera mis à jour après seed des applications
                    'accepted_candidates' => 0,
                    'created_at' => $createdAt,
                    'updated_at' => now(),
                    'sub_job_ids' => null,
                ]);

                $this->jobIds[] = $jobId;
            }
        }
    }

    // ------------------------------------------------------------------
    // 6. Applications (le cœur des KPI recruitment)
    // ------------------------------------------------------------------
    private function seedApplications(): void
    {
        if (empty($this->userIds) || empty($this->jobIds)) {
            $this->command->warn('⚠️ Pas de users ou jobs, skip applications.');
            return;
        }

        $cleanUserIds = array_values(array_unique($this->userIds));
        $cleanJobIds = array_values(array_unique($this->jobIds));

        $maxAppId = DB::table('applications')->max('id') ?? 0;
        $nextAppId = $maxAppId + 1;

        // Statuts pondérés : plus d'accepted/declined, moins de withdrawn/pending
        $statuses = ['accepted', 'accepted', 'accepted', 'declined', 'declined',
                     'withdrawn', 'withdrawn', 'backup', 'approved', 'pending', 'pending'];

        // Répartition temporelle
        $slots = [
            [0, 6, 18],    // 0-6 jours  -> 18 applications
            [7, 13, 24],   // 7-13 jours -> 24 applications
            [14, 29, 32],  // 14-29 jours -> 32 applications
            [30, 55, 30],  // 30-55 jours -> 30 applications
            [56, 120, 16], // 56-120 jours -> 16 applications
        ];

        $acceptedByJob = []; // pour Position Fill Rate cohérent

        foreach ($slots as [$minDays, $maxDays, $count]) {
            for ($i = 0; $i < $count; $i++) {
                $userId = $cleanUserIds[array_rand($cleanUserIds)];
                $jobId = $cleanJobIds[array_rand($cleanJobIds)];
                $status = $statuses[array_rand($statuses)];

                $createdAt = Carbon::now()->subDays(rand($minDays, $maxDays))
                    ->setTime(rand(8, 18), rand(0, 59), rand(0, 59));

                // Les décisions (accepted/declined/withdrawn/backup/approved)
                // ont un updated_at (date de traitement) > created_at
                $isDecided = in_array($status, ['accepted', 'declined', 'withdrawn', 'backup', 'approved']);
                $updatedAt = $isDecided
                    ? $createdAt->copy()->addDays(rand(1, 12))->addHours(rand(0, 12))
                    : $createdAt; // pending : pas encore traité

                // Anti-doublon simple : user + job + created_at unique
                DB::table('applications')->insertOrIgnore([
                    'id' => $nextAppId,
                    'user_id' => $userId,
                    'job_id' => $jobId,
                    'sub_job_id' => null,
                    'status' => $status,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                    'applied_at' => $createdAt,
                    'shift_id' => null,
                    'shift_group_id' => null,
                    'is_supervisor' => 0,
                ]);

                if ($status === 'accepted') {
                    $acceptedByJob[$jobId] = ($acceptedByJob[$jobId] ?? 0) + 1;
                }

                $nextAppId++;
            }
        }

        // Synchroniser accepted_candidates sur project_jobs
        foreach ($acceptedByJob as $jobId => $count) {
            $existing = DB::table('project_jobs')->where('id', $jobId)->value('accepted_candidates') ?? 0;
            DB::table('project_jobs')->where('id', $jobId)->update([
                'accepted_candidates' => $existing + $count,
                'updated_at' => now(),
            ]);
        }

        $this->command->info('📄 Applications créées (statuts répartis sur 120 jours).');
    }

    // ------------------------------------------------------------------
    // 7. Attendances (Workforce KPIs)
    // ------------------------------------------------------------------
    private function seedAttendances(): void
    {
        if (empty($this->userIds)) {
            $this->command->warn('⚠️ Pas de users, skip attendances.');
            return;
        }

        $cleanUserIds = array_values(array_unique($this->userIds));
        $shiftIds = DB::table('shifts')->pluck('id')->toArray();
        $statuses = ['present', 'present', 'present', 'late', 'present', 'present', 'late', 'absent'];

        $maxId = DB::table('attendances')->max('id') ?? 0;
        $nextId = $maxId + 1;

        // 60 attendances réparties sur 45 jours
        for ($i = 0; $i < 60; $i++) {
            $user = $cleanUserIds[array_rand($cleanUserIds)];
            $checkIn = Carbon::now()->subDays(rand(0, 45))->setTime(rand(8, 10), rand(0, 59), 0);
            $checkOut = $checkIn->copy()->addHours(rand(6, 10))->addMinutes(rand(0, 59));
            $status = $statuses[array_rand($statuses)];

            DB::table('attendances')->insert([
                'id' => $nextId + $i,
                'user_id' => $user,
                'shift_id' => !empty($shiftIds) ? $shiftIds[array_rand($shiftIds)] : null,
                'job_id' => !empty($this->jobIds) ? $this->jobIds[array_rand($this->jobIds)] : null,
                'project_id' => !empty($this->projectIds) ? $this->projectIds[array_rand($this->projectIds)] : null,
                'scanner_id' => $user,
                'checkout_scanner_id' => $user,
                'check_in_time' => $checkIn,
                'check_out_time' => $status === 'absent' ? null : $checkOut,
                'total_hours' => $status === 'absent' ? 0 : round($checkIn->diffInHours($checkOut), 2),
                'status' => $status,
                'notes' => $status === 'late' ? 'User was late for shift' : ($status === 'absent' ? 'No show' : 'On time'),
                'created_at' => $checkIn,
                'updated_at' => $checkOut,
            ]);
        }

        $this->command->info('👥 60 attendances créées sur 45 jours.');
    }

    // ------------------------------------------------------------------
    // 8. User ratings (Average Worker Rating)
    // ------------------------------------------------------------------
    private function seedUserRatings(): void
    {
        if (empty($this->userIds)) {
            return;
        }

        $cleanUserIds = array_values(array_unique($this->userIds));

        $maxId = DB::table('user_ratings')->max('id') ?? 0;
        $nextId = $maxId + 1;

        // 60 notes entre 2 et 5 pour une moyenne réaliste
        for ($i = 0; $i < 60; $i++) {
            $user = $cleanUserIds[array_rand($cleanUserIds)];

            DB::table('user_ratings')->insertOrIgnore([
                'id' => $nextId + $i,
                'user_id' => $user,
                'rating' => rand(2, 5),
                'created_at' => Carbon::now()->subDays(rand(0, 60)),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('⭐ 60 user_ratings créés.');
    }

    // ------------------------------------------------------------------
    // 9. Todos (Overdue Tasks)
    // ------------------------------------------------------------------
    private function seedTodos(): void
    {
        if (empty($this->userIds)) {
            return;
        }

        $cleanUserIds = array_values(array_unique($this->userIds));
        $statuses = ['pending', 'pending', 'in_progress', 'done'];
        $levels = ['urgent', 'normal', 'low'];

        $maxId = DB::table('todos')->max('id') ?? 0;
        $nextId = $maxId + 1;

        // 30 todos : la moitié en retard, l'autre sur le point de l'être
        for ($i = 0; $i < 30; $i++) {
            // On attribue un `$due` (référence) à partir de la date calculée
            $dueDate = Carbon::now()->subDays(rand(0, 15))->addDays(rand(0, 14));
            $due = $dueDate;

            DB::table('todos')->insertOrIgnore([
                'id' => $nextId + $i,
                'company_user_id' => $cleanUserIds[array_rand($cleanUserIds)],
                'assigned_by' => $cleanUserIds[array_rand($cleanUserIds)],
                'title' => 'KPI Dashboard Todo #' . ($i + 1),
                'message' => 'Task generated by KpiDashboardSeeder',
                'status' => $statuses[array_rand($statuses)],
                'level' => $levels[array_rand($levels)],
                'due_date' => $dueDate,
                'created_at' => $due->copy()->subDays(rand(1, 20)),
                'updated_at' => now(),
                'project_id' => !empty($this->projectIds) ? $this->projectIds[array_rand($this->projectIds)] : null,
            ]);
        }

        $this->command->info('📋 30 todos créés.');
    }

    // ------------------------------------------------------------------
    // 10. Penalties (tworzenia via penalties + user_penalties)
    // ------------------------------------------------------------------
    private function seedPenalties(): void
    {
        $userPenaltyTable = DB::getSchemaBuilder()->hasTable('user_penalties') ? 'user_penalties' : null;

        $penalties = [
            ['Late Arrival', 'Penalty for late arrival', 'wallet', 15],
            ['No Show', 'Penalty for missing a shift', 'wallet', 25],
            ['Cancellation', 'Cancellation penalty', 'wallet', 40],
            ['Extra Shift Bonus', 'Bonus for extra job', 'both', 20],
            ['Performance Points', 'Points for good performance', 'points', 10],
        ];

        foreach ($penalties as $i => [$name, $desc, $type, $amount]) {
            DB::table('penalties')->updateOrInsert(
                ['name' => $name],
                [
                    'company_id' => DB::table('companies')->inRandomOrder()->value('id'),
                    'description' => $desc,
                    'type' => $type,
                    'points_value' => $type === 'points' ? $amount : null,
                    'wallet_amount' => $type !== 'points' ? $amount : null,
                    'is_active' => 1,
                    'auto_assign' => rand(0, 1),
                    'cancellation_penalty' => $name === 'Cancellation' ? 1 : 0,
                    'created_at' => Carbon::now()->subDays(rand(20, 90)),
                    'updated_at' => now(),
                ]
            );
        }

        // Si la table user_penalties existe, y associer quelques pénalités
        if ($userPenaltyIds = DB::table('user_penalties')->count()) {
            $this->command->info('🪙 5 penalties configurées.');
            return;
        }

        $penaltyRows = DB::table('penalties')->pluck('id')->toArray();
        if (empty($penaltyRows) || empty($this->userIds)) {
            return;
        }

        $cleanUsers = array_values(array_unique($this->userIds));

        $maxId = DB::table('user_penalties')->max('id') ?? 0;
        $nextId = $maxId + 1;

        for ($i = 0; $i < 15; $i++) {
            DB::table('user_penalties')->insertOrIgnore([
                'id' => $nextId + $i,
                'user_id' => $cleanUsers[array_rand($cleanUsers)],
                'penalty_id' => $penaltyRows[array_rand($penaltyRows)],
                'shift_id' => DB::table('shifts')->inRandomOrder()->value('id'),
                'attendance_id' => DB::table('attendances')->inRandomOrder()->value('id'),
                'created_at' => Carbon::now()->subDays(rand(0, 60)),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('💶 15 user_penalties associées.');
    }

    // ------------------------------------------------------------------
    // 11. Gallery (Profile Completion KPI)
    // ------------------------------------------------------------------
    private function seedGalleryImages(): void
    {
        $galleryCount = DB::table('gallery')->count();

        // On ajoute uniquement les images actives pour les users sans photo
        $usersWithoutGallery = DB::table('users')
            ->leftJoin('gallery', 'gallery.user_id', '=', 'users.id')
            ->whereNull('gallery.id')
            ->limit(20)
            ->pluck('users.id')
            ->toArray();

        if (empty($usersWithoutGallery)) {
            return;
        }

        $maxId = DB::table('gallery')->max('id') ?? 0;
        $nextId = $maxId + 1;

        foreach ($usersWithoutGallery as $i => $userId) {
            DB::table('gallery')->insertOrIgnore([
                'id' => $nextId + $i,
                'user_id' => $userId,
                'image_path' => 'uploads/kpi-dashboard/avatar-' . $userId . '.jpg',
                'mime_type' => 'image/jpeg',
                'is_active' => 1,
                'sort_order' => 0,
                'created_at' => now()->subDays(rand(5, 90)),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('🖼️ ' . count($usersWithoutGallery) . ' images gallery ajoutées.');
    }

    // ------------------------------------------------------------------
    // Helpers (names/cities réalistes)
    // ------------------------------------------------------------------
    private function fakerName(): string
    {
        $first = ['Ahmed', 'Sara', 'Karim', 'Lina', 'Youssef', 'Mariam', 'Omar', 'Nour', 'Rayen', 'Hana',
                  'Adam', 'Ilona', 'Tarek', 'Zainab', 'Mehdi', 'Amira', 'Bilal', 'Selma', 'Hamza', 'Rania'];
        return $first[array_rand($first)];
    }

    private function fakerLastName(): string
    {
        $last = ['Benali', 'Trabelsi', 'Haddad', 'Mansour', 'Garcia', 'Martin', 'Ali', 'Hassan',
                 'Khan', 'Smith', 'Johnson', 'Rahman', 'Kacem', 'Fares', 'Mansouri', 'Ahmadi', 'Scott', 'Brown'];
        return $last[array_rand($last)];
    }

    private function randomCity(): string
    {
        $cities = ['Tunis', 'Paris', 'Casablanca', 'Cairo', 'Doha', 'Madrid', 'Istanbul',
                   'Milan', 'Berlin', 'London', 'Riyadh', 'Dubai', 'Lyon', 'Marseille'];
        return $cities[array_rand($cities)];
    }
}
