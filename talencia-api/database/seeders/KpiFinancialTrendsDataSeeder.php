<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KpiFinancialTrendsDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedMonthlyCosts();
        $this->seedWorkerRatings();
        $this->seedApplicationTrends();
    }

    /**
     * KPI: Monthly Cost Trend
     * Répartir les coûts des projects sur 12 mois
     */
    private function seedMonthlyCosts()
    {
        // Mettre à jour les projects existants avec des start_dates réparties sur 12 mois
        $projects = DB::table('projects')->get();

        foreach ($projects as $project) {
            $month = rand(1, 12);
            $year = now()->year;

            $newStartDate = Carbon::createFromDate($year, $month, 1)
                ->addDays(rand(0, 28))
                ->toDateString();

            DB::table('projects')
                ->where('id', $project->id)
                ->update([
                    'start_date' => $newStartDate,
                    'total_cost' => rand(5000, 50000),
                    'currency' => ['EUR', 'QAR', 'USD'][array_rand(['EUR', 'QAR', 'USD'])],
                ]);
        }

        $this->command->info("✅ Monthly costs updated across 12 months");
    }

    /**
     * KPI: Average Worker Rating
     * Créer des ratings pour que la moyenne soit calculée
     */
    private function seedWorkerRatings()
    {
        $maxId = DB::table('ratings')->max('id') ?? 0;
        $nextId = $maxId + 1;

        $users = DB::table('users')->pluck('id')->toArray();
        $shifts = DB::table('shifts')->pluck('id')->toArray();

        if (empty($users) || empty($shifts)) {
            $this->command->warn("⚠️ Pas assez de users/shifts pour les ratings");
            return;
        }

        // Créer 50+ ratings pour avoir une moyenne significative
        foreach (range(1, 50) as $i) {
            DB::table('ratings')->insert([
                'id' => $nextId + $i - 1,
                'user_id' => $users[array_rand($users)],
                'value_id' => rand(1, 10),
                'score' => rand(2, 5),  // Entre 2 et 5 pour avoir une bonne moyenne
                'feedback_id' => rand(1, 100),
                'shift_id' => $shifts[array_rand($shifts)],
                'created_at' => Carbon::now()->subDays(rand(0, 90)),
                'updated_at' => Carbon::now(),
            ]);
        }

        $this->command->info("✅ 50 worker ratings created");
    }

    /**
     * KPI: New Applications Trend
     * Créer des applications réparties sur les 2 dernières semaines
     */
    private function seedApplicationTrends()
    {
        $maxId = DB::table('applications')->max('id') ?? 0;
        $nextId = $maxId + 1;

        $projectJobs = DB::table('project_jobs')->pluck('id')->toArray();
        $users = DB::table('users')->pluck('id')->toArray();

        if (empty($projectJobs) || empty($users)) {
            $this->command->warn("⚠️ Pas assez de project_jobs/users pour les applications");
            return;
        }

        $statuses = ['pending', 'accepted', 'declined', 'withdrawn', 'backup', 'approved'];

        // Créer 20 applications cette semaine
        foreach (range(1, 20) as $i) {
            $appliedAt = Carbon::now()->subDays(rand(0, 6));  // 0-6 jours = cette semaine

            DB::table('applications')->insert([
                'id' => $nextId + $i - 1,
                'user_id' => $users[array_rand($users)],
                'job_id' => $projectJobs[array_rand($projectJobs)],
                'status' => $statuses[array_rand($statuses)],
                'created_at' => $appliedAt,
                'updated_at' => $appliedAt,
                'applied_at' => $appliedAt,
            ]);
        }

        // Créer 15 applications semaine dernière
        foreach (range(21, 35) as $i) {
            $appliedAt = Carbon::now()->subDays(rand(7, 13));  // 7-13 jours = semaine dernière

            DB::table('applications')->insert([
                'id' => $nextId + $i - 1,
                'user_id' => $users[array_rand($users)],
                'job_id' => $projectJobs[array_rand($projectJobs)],
                'status' => $statuses[array_rand($statuses)],
                'created_at' => $appliedAt,
                'updated_at' => $appliedAt,
                'applied_at' => $appliedAt,
            ]);
        }

        $this->command->info("✅ 35 applications created (20 this week, 15 last week)");
    }
}
