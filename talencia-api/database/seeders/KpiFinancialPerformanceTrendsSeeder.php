<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KpiFinancialPerformanceTrendsSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedProjects();
        $this->seedTodos();
        $this->seedRatings();
    }

    private function seedProjects()
    {
        $statuses = ['active', 'inactive', 'draft', 'closed', 'completed'];
        $maxId = DB::table('projects')->max('id') ?? 0;
        $nextId = $maxId + 1;

        $supervisors = DB::table('users')->pluck('id')->toArray();
        $companies = DB::table('companies')->pluck('id')->toArray();

        if (empty($supervisors) || empty($companies)) {
            $this->command->warn("⚠️ Pas assez de supervisors/companies");
            return;
        }

        foreach (range(1, 14) as $i) {
            $startDate = Carbon::now()->subMonths(rand(1, 12))->toDateString();
            $endDate = Carbon::parse($startDate)->addMonths(rand(1, 6))->toDateString();
            $status = $statuses[array_rand($statuses)];
            $currency = ['EUR', 'QAR', 'USD'][array_rand(['EUR', 'QAR', 'USD'])];

            $projectId = $nextId + $i - 1;

            DB::table('projects')->insert([
                'id' => $projectId,
                'company_id' => $companies[array_rand($companies)],
                'title' => "Project {$i}",
                'supervisor_id' => $supervisors[array_rand($supervisors)],
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_cost' => rand(5000, 50000),
                'currency' => $currency,
                'is_total_per_hour' => rand(0, 1),
                'is_total_per_date' => rand(0, 1),
                'status' => $status,
                'created_at' => Carbon::parse($startDate),
                'updated_at' => Carbon::now(),
            ]);

            // Ajouter des project_jobs - COLONNES CORRECTES
            foreach (range(1, rand(2, 5)) as $job) {
                $maxJobId = DB::table('project_jobs')->max('id') ?? 0;

                DB::table('project_jobs')->insert([
                    'id' => $maxJobId + 1,
                    'professions_id' => rand(1, 10),
                    'display_project' => 1,
                    'project_id' => $projectId,
                    'client_id' => null,
                    'top' => rand(0, 1),
                    'description' => "Job {$job} for Project {$i}",
                    'candidates_number' => rand(5, 50),
                    'candidatures_number' => rand(10, 100),
                    'status' => 'published',
                    'is_promoted' => rand(0, 1),
                    'promoted_at' => rand(0, 1) ? Carbon::now() : null,
                    'project_display' => rand(0, 1),
                    'accepted_candidates' => rand(0, 3),
                    'created_at' => Carbon::parse($startDate),
                    'updated_at' => Carbon::now(),
                    'sub_job_ids' => null,
                ]);
            }
        }

        $this->command->info("✅ 14 projects seeded with jobs");
    }

    private function seedTodos()
    {
        $statuses = ['pending', 'in_progress', 'done'];
        $levels = ['urgent', 'normal'];
        $maxId = DB::table('todos')->max('id') ?? 0;
        $nextId = $maxId + 1;

        $users = DB::table('users')->pluck('id')->toArray();
        $projects = DB::table('projects')->pluck('id')->toArray();

        if (empty($users)) {
            $this->command->warn("⚠️ Aucun user trouvé");
            return;
        }

        foreach (range(1, 20) as $i) {
            $dueDate = Carbon::now()->addDays(rand(1, 30));
            $status = $statuses[array_rand($statuses)];
            $level = $levels[array_rand($levels)];
            $createdAt = Carbon::now()->subDays(rand(5, 30));

            DB::table('todos')->insert([
                'id' => $nextId + $i - 1,
                'company_user_id' => $users[array_rand($users)],
                'assigned_by' => $users[array_rand($users)],
                'title' => "Task {$i}",
                'message' => "Description for task {$i}",
                'status' => $status,
                'level' => $level,
                'due_date' => $dueDate,
                'project_id' => !empty($projects) ? $projects[array_rand($projects)] : null,
                'created_at' => $createdAt,
                'updated_at' => Carbon::now(),
            ]);
        }

        $this->command->info("✅ 20 todos seeded");
    }

    private function seedRatings()
    {
        $maxId = DB::table('ratings')->max('id') ?? 0;
        $nextId = $maxId + 1;

        $users = DB::table('users')->pluck('id')->toArray();
        $shifts = DB::table('shifts')->pluck('id')->toArray();

        if (empty($users) || empty($shifts)) {
            $this->command->warn("⚠️ Pas assez de users/shifts");
            return;
        }

        foreach (range(1, 30) as $i) {
            DB::table('ratings')->insert([
                'id' => $nextId + $i - 1,
                'user_id' => $users[array_rand($users)],
                'value_id' => rand(1, 10),
                'score' => rand(1, 5),
                'feedback_id' => rand(1, 50),
                'shift_id' => $shifts[array_rand($shifts)],
                'created_at' => Carbon::now()->subDays(rand(0, 60)),
                'updated_at' => Carbon::now(),
            ]);
        }

        $this->command->info("✅ 30 ratings seeded");
    }
}
