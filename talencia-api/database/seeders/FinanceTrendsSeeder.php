<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FinanceTrendsSeeder
 *
 * Alimente de façon DÉTERMINISTE et RÉEXÉCUTABLE les tables utilisées par les
 * catégories Finance et Trends du dashboard :
 *
 *   Finance : projects.total_cost / created_at / currency,
 *             project_jobs.accepted_candidates
 *   Trends  : applications.created_at, projects.created_at,
 *             penalties.wallet_amount / created_at
 *
 * Garanties :
 *  - Déterministe : mt_srand(SEED) -> même dataset à chaque exécution.
 *  - Idempotent : purge d'abord ses propres lignes (préfixe "FT-") dans le
 *    bon ordre (applications -> project_jobs -> projects -> user_penalties ->
 *    penalties) avant de régénérer. Zéro doublon.
 *  - Aucun orphelin : toutes les références (company_id, supervisor_id,
 *    professions_id, user_id, job_id) proviennent des tables existantes.
 *  - Aucune insertion manuelle d'ID (auto-incrément MySQL uniquement).
 *  - Devise unique EUR pour tout le dataset Finance généré.
 *  - created_at des projets positionné explicitement dans chacun des 12 mois
 *    glissants ciblés (le KPI monthly-cost-trend groupe sur created_at).
 *  - Ne touche jamais aux données existantes non générées par ce seeder.
 */
class FinanceTrendsSeeder extends Seeder
{
    /** Préfixe marquant les lignes appartenant à ce seeder */
    private const MARKER = 'FT-';

    /** Graine déterministe (date du jour de création du dataset) */
    private const SEED = 20260824;

    /** Nombre de mois glissants couverts (aligne sur monthly-cost-trend) */
    private const MONTHS = 12;

    /**
     * Nombre de projets par mois (index 0 = mois le plus ancien).
     * Somme = 38 projets.
     */
    private const PROJECTS_PER_MONTH = [2, 3, 2, 4, 3, 3, 2, 4, 3, 4, 4, 4];

    /**
     * Candidatures par semaine (index 0 = semaine la plus ancienne,
     * index 7 = semaine courante). Tendance croissante avec fluctuations :
     * semaine courante 16 vs semaine précédente 14 -> growth_rate +14.3% ("good").
     */
    private const APPLICATIONS_PER_WEEK = [6, 8, 7, 10, 12, 11, 14, 16];

    /**
     * Compteurs d'ID séquentiels.
     *
     * NB : dans ce schéma, AUCUNE table n'est auto-incrémentée (vérifié via
     * information_schema.COLUMNS, EXTRA vide), une valeur d'id explicite est
     * donc obligatoire à l'INSERT. Le compteur est initialisé UNE SEULE FOIS
     * sur max(id) au début de la transaction, puis incrémenté localement :
     * pas de course critique (seed mono-processus, transactionnel), aucun
     * doublon possible, et pas de requête max() par ligne.
     */
    private array $idCounters = [];

    private function nextId(string $table): int
    {
        if (! isset($this->idCounters[$table])) {
            $this->idCounters[$table] = (int) DB::table($table)->max('id');
        }

        return ++$this->idCounters[$table];
    }

    public function run(): void
    {
        // Déterminisme : même séquence pseudo-aléatoire à chaque exécution
        mt_srand(self::SEED);

        $companyIds = DB::table('companies')->pluck('id')->map(fn ($v) => (int) $v)->all();
        $userIds = DB::table('users')->pluck('id')->map(fn ($v) => (int) $v)->all();
        $professionIds = Schema::hasTable('professions')
            ? DB::table('professions')->pluck('id')->map(fn ($v) => (int) $v)->all()
            : [];

        if (empty($companyIds) || empty($userIds)) {
            $this->command->warn('⚠️  FinanceTrendsSeeder : companies/users manquants, seeding ignoré.');

            return;
        }

        DB::transaction(function () use ($companyIds, $userIds, $professionIds) {
            $this->purgePreviousRun();

            $projectIdsByMonth = $this->seedProjects($companyIds, $userIds);

            $jobIds = $this->seedProjectJobs($projectIdsByMonth, $professionIds);

            $this->seedApplications($userIds, $jobIds);

            $this->seedPenalties($companyIds);
        });

        $this->command->info('✅ FinanceTrendsSeeder terminé (déterministe, graine '.self::SEED.').');
    }

    // ------------------------------------------------------------------
    // Purge du run précédent (ordre sûr : enfants avant parents)
    // ------------------------------------------------------------------
    private function purgePreviousRun(): void
    {
        $ftProjectIds = DB::table('projects')
            ->where('title', 'like', self::MARKER.'%')
            ->pluck('id');

        if ($ftProjectIds->isNotEmpty()) {
            $ftJobIds = DB::table('project_jobs')
                ->whereIn('project_id', $ftProjectIds)
                ->pluck('id');

            // 1. Applications liées aux jobs FT
            if ($ftJobIds->isNotEmpty()) {
                DB::table('applications')->whereIn('job_id', $ftJobIds)->delete();
            }

            // 2. Sécurité : lignes d'autres tables pouvant référencer projets/jobs FT
            if (Schema::hasTable('attendances')) {
                DB::table('attendances')->whereIn('project_id', $ftProjectIds)->delete();
                if ($ftJobIds->isNotEmpty()) {
                    DB::table('attendances')->whereIn('job_id', $ftJobIds)->delete();
                }
            }
            if (Schema::hasTable('todos')) {
                DB::table('todos')->whereIn('project_id', $ftProjectIds)->delete();
            }

            // 3. Jobs FT, puis 4. Projets FT
            DB::table('project_jobs')->whereIn('project_id', $ftProjectIds)->delete();
            DB::table('projects')->whereIn('id', $ftProjectIds)->delete();
        }

        // 5. Penalties FT (et leurs liaisons user_penalties éventuelles)
        $ftPenaltyIds = DB::table('penalties')
            ->where('name', 'like', self::MARKER.'%')
            ->pluck('id');

        if ($ftPenaltyIds->isNotEmpty()) {
            if (Schema::hasTable('user_penalties')) {
                DB::table('user_penalties')->whereIn('penalty_id', $ftPenaltyIds)->delete();
            }
            DB::table('penalties')->whereIn('id', $ftPenaltyIds)->delete();
        }
    }

    // ------------------------------------------------------------------
    // Finance : projects répartis sur 12 mois glissants (created_at explicite)
    // ------------------------------------------------------------------
    private function seedProjects(array $companyIds, array $userIds): array
    {
        $now = Carbon::now();
        $projectIdsByMonth = [];

        foreach (range(0, self::MONTHS - 1) as $m) {
            $count = self::PROJECTS_PER_MONTH[$m];

            // Budget mensuel : tendance croissante + saisonnalité sinus + bruit seedé ±10 %
            $base = 14000 + 1700 * $m;
            $seasonal = 1 + 0.15 * sin(($m + 2) * 0.9);
            $noise = 1 + (mt_rand() % 21 - 10) / 100;
            $monthlyBudget = $base * $seasonal * $noise;

            // Poids de partage intra-mois (déterministes)
            $weights = [];
            foreach (range(1, $count) as $i) {
                $weights[] = 60 + (($i * 37 + $m * 13) % 80); // 60..139
            }
            $weightSum = array_sum($weights);

            $monthStart = $now->copy()->subMonths(self::MONTHS - 1 - $m)->startOfMonth();

            foreach (range(1, $count) as $i) {
                $cost = max(3000, round(($monthlyBudget * $weights[$i - 1] / $weightSum) / 50) * 50);

                // Jour du mois déterministe (1..26), heure ouvrée
                $day = 1 + (($i * 7 + $m * 3) % 26);
                $createdAt = $monthStart->copy()->addDays($day - 1)
                    ->setTime(9 + ($i % 8), ($i * 11) % 60, 0);

                // Durée du projet : 4 à 22 mois selon un motif stable
                $durationMonths = 4 + (($m * 5 + $i * 3) % 19);
                $startDate = $createdAt->copy()->toDateString();
                $endDate = $createdAt->copy()->addMonths($durationMonths)->toDateString();

                // Statut cohérent avec l'ancienneté :
                //  - mois récents (>= 9) : actifs
                //  - mois anciens : majorité clôturés, quelques actifs (overdue réalistes)
                if ($m >= self::MONTHS - 3) {
                    $status = 'active';
                } else {
                    $cycle = ['completed', 'closed', 'completed', 'active', 'completed'];
                    $status = $cycle[($m * 3 + $i) % 5];
                }

                $projectId = $this->nextId('projects');

                DB::table('projects')->insert([
                    'id' => $projectId,
                    'company_id' => $companyIds[mt_rand() % count($companyIds)],
                    'title' => sprintf(
                        '%s%s %s #%d',
                        self::MARKER,
                        ['Event Staffing', 'Venue Operations', 'Guest Services', 'Logistics Support'][$m % 4],
                        $monthStart->format('M Y'),
                        $i
                    ),
                    'supervisor_id' => $userIds[mt_rand() % count($userIds)],
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'total_cost' => $cost,
                    'currency' => 'EUR',
                    'is_total_per_hour' => 0,
                    'is_total_per_date' => 1,
                    'status' => $status,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $projectIdsByMonth[$m][] = [
                    'id' => $projectId,
                    'index' => $i,
                    'created_at' => $createdAt,
                ];
            }
        }

        $projectCount = array_sum(array_map('count', $projectIdsByMonth));
        $this->command->info("💶 {$projectCount} projets FT insérés sur ".self::MONTHS.' mois (devise EUR).');

        return $projectIdsByMonth;
    }

    // ------------------------------------------------------------------
    // Finance : project_jobs avec accepted_candidates corrélés à l'âge
    // ------------------------------------------------------------------
    private function seedProjectJobs(array $projectIdsByMonth, array $professionIds): array
    {
        $jobIds = [];

        if (empty($professionIds)) {
            $this->command->warn('⚠️  Aucune profession existante : project_jobs FT ignorés.');

            return $jobIds;
        }

        foreach ($projectIdsByMonth as $m => $projects) {
            foreach ($projects as $project) {
                $jobsCount = 2 + ($project['index'] % 3); // 2 à 4 jobs

                for ($j = 1; $j <= $jobsCount; $j++) {
                    // Ancienneté -> taux de remplissage croissant (projets anciens mieux remplis)
                    $fillRate = min(0.85, 0.15 + 0.06 * $m);
                    $candidatesNumber = 4 + (($m * 3 + $j * 7) % 20); // 4..23
                    $accepted = (int) min(
                        $candidatesNumber,
                        floor($candidatesNumber * $fillRate + (($m + $j) % 2))
                    );

                    $createdAt = $project['created_at']->copy()->addDays($j);

                    $jobId = $this->nextId('project_jobs');

                    DB::table('project_jobs')->insert([
                        'id' => $jobId,
                        'professions_id' => $professionIds[mt_rand() % count($professionIds)],
                        'display_project' => 1,
                        'project_id' => $project['id'],
                        'client_id' => null,
                        'top' => ($m >= self::MONTHS - 3 && $j === 1) ? 1 : 0,
                        'description' => 'Staffing requirement '.$j.' — generated by FinanceTrendsSeeder',
                        'candidates_number' => $candidatesNumber,
                        'candidatures_number' => $candidatesNumber * 3 + (($m + $j * 5) % 15),
                        'status' => 'published',
                        'is_promoted' => 0,
                        'promoted_at' => null,
                        'project_display' => 1,
                        'accepted_candidates' => $accepted,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                        'sub_job_ids' => null,
                    ]);

                    $jobIds[] = $jobId;
                }
            }
        }

        $this->command->info('🧾 '.count($jobIds).' project_jobs FT insérés.');

        return $jobIds;
    }

    // ------------------------------------------------------------------
    // Trends : applications sur 8 semaines, tendance croissante déterministe
    // ------------------------------------------------------------------
    private function seedApplications(array $userIds, array $jobIds): void
    {
        if (empty($jobIds)) {
            $this->command->warn('⚠️  Aucun job FT disponible : applications FT ignorées.');

            return;
        }

        $statuses = ['pending', 'accepted', 'pending', 'declined', 'accepted', 'backup', 'pending', 'approved'];
        $now = Carbon::now();
        $inserted = 0;

        foreach (self::APPLICATIONS_PER_WEEK as $w => $weekCount) {
            for ($i = 0; $i < $weekCount; $i++) {
                // Semaine courante (w=7) -> jours 0..6 ; semaine précédente (w=6) -> 7..13 ; etc.
                $daysAgo = (count(self::APPLICATIONS_PER_WEEK) - 1 - $w) * 7 + ($i % 7);
                $createdAt = $now->copy()->subDays($daysAgo)
                    ->setTime(8 + (($i * 3) % 11), ($i * 17 + $w * 7) % 60, 0);

                DB::table('applications')->insert([
                    'id' => $this->nextId('applications'),
                    'user_id' => $userIds[mt_rand() % count($userIds)],
                    'job_id' => $jobIds[mt_rand() % count($jobIds)],
                    'status' => $statuses[($i + $w) % count($statuses)],
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                    'applied_at' => $createdAt,
                ]);

                $inserted++;
            }
        }

        $thisWeek = self::APPLICATIONS_PER_WEEK[count(self::APPLICATIONS_PER_WEEK) - 1];
        $lastWeek = self::APPLICATIONS_PER_WEEK[count(self::APPLICATIONS_PER_WEEK) - 2];
        $growth = $lastWeek > 0 ? round((($thisWeek - $lastWeek) / $lastWeek) * 100, 1) : 100;

        $this->command->info("📈 {$inserted} applications FT insérées (semaine courante {$thisWeek} vs {$lastWeek} -> +{$growth}%).");
    }

    // ------------------------------------------------------------------
    // Trends : penalties sur 6 mois, fréquence décroissante (amélioration)
    // ------------------------------------------------------------------
    private function seedPenalties(array $companyIds): void
    {
        $names = [
            'FT-Late Arrival',
            'FT-Missed Shift Check-in',
            'FT-No-Show Partial',
            'FT-Late Badge Return',
        ];

        // Moins de pénalités récentes : motif mois cible (0 = mois courant ... 5 = M-5)
        $monthsAgo = [5, 5, 4, 4, 3, 3, 3, 2, 2, 1, 1, 0];

        foreach ($monthsAgo as $i => $mAgo) {
            $createdAt = Carbon::now()->subMonths($mAgo)
                ->subDays(mt_rand() % 20)
                ->setTime(10 + ($i % 6), ($i * 13) % 60, 0);

            DB::table('penalties')->insert([
                'id' => $this->nextId('penalties'),
                'company_id' => $companyIds[mt_rand() % count($companyIds)],
                'name' => $names[$i % count($names)],
                'description' => 'Automatically generated by FinanceTrendsSeeder (deterministic dataset)',
                'type' => 'wallet',
                'points_value' => null,
                'wallet_amount' => 25 + (($i * 17) % 95), // 25..119 EUR
                'is_active' => 1,
                'auto_assign' => 0,
                'cancellation_penalty' => 0,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        $this->command->info('⚠️ '.count($monthsAgo).' penalties FT insérées (fréquence décroissante).');
    }
}