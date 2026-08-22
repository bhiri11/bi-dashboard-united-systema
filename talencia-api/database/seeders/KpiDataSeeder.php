<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KpiDataSeeder extends Seeder
{
    public function run(): void
    {
        // Créer 20 users avec le factory
        $users = User::factory(20)->create();
        $userIds = $users->pluck('id')->toArray();

        // Créer des applications pour les KPIs Recruitment
        $this->seedApplications($userIds);

        // Créer des projects et project_jobs pour les KPIs Financial & Performance
        $this->seedProjects($userIds);

        // Créer des attendances pour les KPIs Workforce
        $this->seedAttendances($userIds);

        // Créer des todos/tasks pour les KPIs Performance
        $this->seedTasks($userIds);

        // Créer des penalties pour les KPIs Trends
        $this->seedPenalties($userIds);

        // Créer des ratings pour les KPIs Performance
        $this->seedRatings($userIds);
    }

    private function seedApplications($userIds)
    {
        $statuses = ['accepted', 'declined', 'withdrawn', 'backup', 'approved'];

        foreach (range(1, 100) as $i) {
            DB::table('applications')->insert([
                'user_id' => $userIds[array_rand($userIds)],
                'job_id' => rand(1, 30),
                'status' => $statuses[array_rand($statuses)],
                'created_at' => Carbon::now()->subDays(rand(0, 90)),
                'updated_at' => Carbon::now()->subDays(rand(0, 30)),
            ]);
        }
    }

    private function seedProjects($userIds)
    {
        $statuses = ['active', 'inactive', 'draft', 'closed', 'completed'];
        $companies = ['TechCorp', 'InnovateLab', 'DigitalSolutions', 'FutureWorks', 'SmartSystems'];

        foreach (range(1, 14) as $i) {
            $startDate = Carbon::now()->subMonths(rand(1, 12));
            $endDate = $startDate->copy()->addMonths(rand(1, 6));
            $status = $statuses[array_rand($statuses)];

            $projectId = DB::table('projects')->insertGetId([
                'title' => "Project {$i} - " . $companies[array_rand($companies)],
                'company_id' => rand(1, 5),
                'description' => "Description for project {$i}",
                'status' => $status,
                'total_cost' => rand(5000, 50000),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'completed_at' => $status === 'completed' ? $endDate : null,
                'created_at' => $startDate,
                'updated_at' => Carbon::now(),
            ]);

            foreach (range(1, rand(2, 5)) as $job) {
                DB::table('project_jobs')->insert([
                    'project_id' => $projectId,
                    'title' => "Job {$job} for Project {$i}",
                    'description' => "Job description",
                    'accepted_candidates' => rand(0, 3),
                    'created_at' => $startDate,
                    'updated_at' => Carbon::now(),
                ]);
            }
        }
    }

    private function seedAttendances($userIds)
    {
        foreach (range(1, 27) as $i) {
            $checkIn = Carbon::now()->subDays(rand(0, 90))->setTime(rand(8, 10), 0, 0);
            $checkOut = $checkIn->copy()->addHours(rand(6, 10));
            $totalHours = $checkIn->diffInHours($checkOut);

            DB::table('attendances')->insert([
                'user_id' => $userIds[array_rand($userIds)],
                'shift_id' => rand(1, 10),
                'job_id' => rand(1, 15),
                'project_id' => rand(1, 14),
                'scanner_id' => $userIds[array_rand($userIds)],
                'checkout_scanner_id' => rand(1, 20),
                'check_in_time' => $checkIn,
                'check_out_time' => $checkOut,
                'total_hours' => $totalHours,
                'status' => rand(0, 1) === 0 ? 'present' : 'late',
                'notes' => rand(0, 1) === 0 ? 'User checked in on time' : 'User was late for shift',
                'created_at' => $checkIn,
                'updated_at' => $checkOut,
            ]);
        }
    }

    private function seedTasks($userIds)
    {
        $statuses = ['pending', 'in_progress', 'done', 'completed'];

        foreach (range(1, 15) as $i) {
            $dueDate = Carbon::now()->subDays(rand(0, 30));
            $status = $statuses[array_rand($statuses)];

            DB::table('tasks')->insert([
                'user_id' => $userIds[array_rand($userIds)],
                'title' => "Task {$i}",
                'description' => "Description for task {$i}",
                'status' => $status,
                'due_date' => $dueDate,
                'created_at' => Carbon::now()->subDays(rand(30, 60)),
                'updated_at' => Carbon::now(),
            ]);
        }
    }

    private function seedPenalties($users)
    {
        $types = ['Late', 'Late Penalty', 'Bonus', 'Gift', 'Points', 'cancellation'];
        $reasons = [
            'Late' => 'penalty for late employees',
            'Late Penalty' => 'this is a late penalty',
            'Bonus' => 'extra job',
            'Gift' => 'gift from solusta',
            'Points' => 'late points',
            'cancellation' => 'cancellation penalty',
        ];

        foreach (range(1, 9) as $i) {
            $type = $types[array_rand($types)];
            $companyId = rand(1, 10);
            $createdAt = Carbon::now()->subDays(rand(0, 90));

            DB::table('penalties')->insert([
                'company_id' => $companyId,
                'name' => $type,
                'description' => $reasons[$type] ?? 'Penalty',
                'type' => in_array($type, ['Bonus', 'Gift', 'Points']) ? 'both' : 'wallet',
                'points_value' => in_array($type, ['Points']) ? rand(1, 10) : null,
                'wallet_amount' => rand(10, 200),
                'is_active' => 1,
                'auto_assign' => rand(0, 1),
                'cancellation_penalty' => $type === 'cancellation' ? 1 : 0,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }

    private function seedRatings($userIds)
    {
        foreach (range(1, 25) as $i) {
            DB::table('user_ratings')->insert([
                'user_id' => $userIds[array_rand($userIds)],
                'rating' => rand(1, 5),
                'comment' => 'Rating comment',
                'created_at' => Carbon::now()->subDays(rand(0, 60)),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
