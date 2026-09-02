<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class KpiCandidatsController extends Controller
{
    private function trendWindow(int $days): array
    {
        $today = Carbon::today();
        $startOfPeriod = $today->copy()->subDays($days - 1)->startOfDay();
        $startOfPreviousPeriod = $today->copy()->subDays(($days * 2) - 1)->startOfDay();
        $endOfPreviousPeriod = $today->copy()->subDays($days)->endOfDay();

        return [$startOfPeriod, $startOfPreviousPeriod, $endOfPreviousPeriod];
    }

    private function getDateRange(Request $request): array
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if ($startDate && $endDate) {
            try {
                return [
                    'start' => Carbon::parse($startDate)->startOfDay(),
                    'end' => Carbon::parse($endDate)->endOfDay(),
                    'label' => "{$startDate} to {$endDate}",
                    'isCustom' => true,
                ];
            } catch (\Exception $e) {
                // Invalid date format, fall back to all time
            }
        }

        return [
            'start' => null,
            'end' => null,
            'label' => 'All time',
            'isCustom' => false,
        ];
    }

    private function getSearchTerm(Request $request): ?string
    {
        $search = $request->query('search');
        if (! $search || trim($search) === '') {
            return null;
        }

        return trim($search);
    }

    /**
     * Applique un filtre de recherche sur les colonnes du user, en ne
     * gardant que les colonnes qui existent réellement dans la table.
     * Si une colonne manque (ex: reference), la recherche continue de
     * fonctionner sur les autres colonnes.
     */
    private function applyUserSearchFilter($query, ?string $search, string $tableAlias = 'users'): void
    {
        if (! $search) {
            return;
        }

        $like = '%' . $search . '%';

        $columns = ['first_name', 'last_name', 'email', 'reference'];
        $existingColumns = array_filter($columns, function ($column) use ($tableAlias) {
            return $this->safeHasColumns($tableAlias, [$column]);
        });

        if (empty($existingColumns)) {
            return;
        }

        $query->where(function ($q) use ($like, $tableAlias, $existingColumns) {
            $first = true;
            foreach ($existingColumns as $column) {
                if ($first) {
                    $q->where($tableAlias . '.' . $column, 'like', $like);
                    $first = false;
                } else {
                    $q->orWhere($tableAlias . '.' . $column, 'like', $like);
                }
            }
        });
    }

    private function formattedPeriodLabel(int $days): string
    {
        return $days === 7 ? 'Last 7 days' : "Last {$days} days";
    }

    private function safeTableExists(string $table): bool
    {
        return Schema::hasTable($table);
    }

    private function safeHasColumns(string $table, array $columns): bool
    {
        if (! Schema::hasTable($table)) {
            return false;
        }

        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                return false;
            }
        }

        return true;
    }

    private function blockedResponse(string $metric, array $requiredFields): array
    {
        return [
            'metric' => $metric,
            'status' => 'blocked',
            'reason' => 'missing_required_fields',
            'required_fields' => $requiredFields,
        ];
    }

    private function recruitmentMetric(string $metric, string $title, string $formula, string $description, array $requiredFields, array $payload = [], bool $blocked = false): array
    {
        return array_merge([
            'metric' => $metric,
            'title' => $title,
            'formula' => $formula,
            'description' => $description,
            'required_fields' => $requiredFields,
            'status' => $blocked ? 'blocked' : 'ok',
        ], $payload);
    }

    private function decidedApplicationStatuses(): array
    {
        return ['accepted', 'declined', 'withdrawn', 'backup', 'approved'];
    }

    public function recruitmentApplicationsKpis(Request $request)
    {
        $dateRange = $this->getDateRange($request);
        $search = $this->getSearchTerm($request);

        $metrics = [
            $this->applicationConversionRate($dateRange, $search),
            $this->averageProcessingTime($dateRange, $search),
            $this->positionFillRate($dateRange, $search),
            $this->applicationsByProfession($dateRange, $search),
            $this->withdrawalRate($dateRange, $search),
        ];

        return response()->json([
            'group' => 'recruitment_applications',
            'status' => 'ok',
            'items' => $metrics,
            'period_label' => $dateRange['label'],
            'search' => $search,
        ]);
    }

    private function applicationConversionRate(array $dateRange = null, ?string $search = null): array
    {
        if (! $this->safeHasColumns('applications', ['status', 'created_at'])) {
            return $this->recruitmentMetric(
                'application_conversion_rate',
                'Application Conversion Rate',
                '(accepted applications / total applications) × 100',
                'Measures how many applications become accepted hires.',
                ['applications.status', 'applications.created_at'],
                $this->blockedResponse('application_conversion_rate', ['applications.status', 'applications.created_at']),
                true
            );
        }

        $query = DB::table('applications as applications')
            ->join('users as users', 'applications.user_id', '=', 'users.id');

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('applications.created_at', [$dateRange['start'], $dateRange['end']]);
        }

        $this->applyUserSearchFilter($query, $search);

        $totalApplications = $query->count();
        $acceptedApplications = $query->where('applications.status', 'accepted')->count();
        $rate = $totalApplications > 0 ? round(($acceptedApplications / $totalApplications) * 100, 1) : 0;

        return $this->recruitmentMetric(
            'application_conversion_rate',
            'Application Conversion Rate',
            '(accepted applications / total applications) × 100',
            'Measures how many applications become accepted hires.',
            ['applications.status', 'applications.created_at'],
            [
                'unit' => '%',
                'value' => $rate,
                'accepted_applications' => $acceptedApplications,
                'total_applications' => $totalApplications,
                'period' => $dateRange ? $dateRange['label'] : 'All time',
            ]
        );
    }

    private function averageProcessingTime(array $dateRange = null, ?string $search = null): array
    {
        if (! $this->safeHasColumns('applications', ['created_at', 'updated_at', 'status'])) {
            return $this->recruitmentMetric(
                'average_processing_time',
                'Average Processing Time',
                'AVG(updated_at - created_at) on decided applications',
                'Average handling time for decided applications.',
                ['applications.created_at', 'applications.updated_at', 'applications.status'],
                $this->blockedResponse('average_processing_time', ['applications.created_at', 'applications.updated_at', 'applications.status']),
                true
            );
        }

        $query = DB::table('applications as applications')
            ->join('users as users', 'applications.user_id', '=', 'users.id')
            ->whereNotNull('applications.created_at')
            ->whereNotNull('applications.updated_at')
            ->whereIn('applications.status', $this->decidedApplicationStatuses());

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('applications.created_at', [$dateRange['start'], $dateRange['end']]);
        }

        $this->applyUserSearchFilter($query, $search);

        $applications = $query->get(['applications.created_at', 'applications.updated_at']);

        $averageHours = 0;

        if ($applications->isNotEmpty()) {
            $averageSeconds = $applications->map(function ($application) {
                return Carbon::parse($application->created_at)->diffInSeconds(Carbon::parse($application->updated_at), true);
            })->avg();

            $averageHours = round(((float) $averageSeconds) / 86400, 2);
        }

        return $this->recruitmentMetric(
            'average_processing_time',
            'Average Processing Time',
            'AVG(updated_at - created_at) on decided applications',
            'Average handling time for decided applications.',
            ['applications.created_at', 'applications.updated_at', 'applications.status'],
            [
                'unit' => 'days',
                'value' => $averageHours,
                'sample_size' => $applications->count(),
                'period' => $dateRange ? $dateRange['label'] : 'All time',
            ]
        );
    }

    private function positionFillRate(array $dateRange = null, ?string $search = null): array
    {
        if (! $this->safeHasColumns('project_jobs', ['accepted_candidates', 'created_at'])) {
            return $this->recruitmentMetric(
                'position_fill_rate',
                'Position Fill Rate',
                '(COUNT(project_jobs WHERE accepted_candidates >= 1) / COUNT(project_jobs)) × 100',
                'Share of job posts with at least one accepted candidate.',
                ['project_jobs.accepted_candidates', 'project_jobs.created_at'],
                $this->blockedResponse('position_fill_rate', ['project_jobs.accepted_candidates', 'project_jobs.created_at']),
                true
            );
        }

        $query = DB::table('project_jobs as project_jobs')
            ->join('projects as projects', 'project_jobs.project_id', '=', 'projects.id');

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('project_jobs.created_at', [$dateRange['start'], $dateRange['end']]);
        }

        if ($search && $this->safeHasColumns('projects', ['title'])) {
            $like = '%' . $search . '%';
            $query->where('projects.title', 'like', $like);
        }

        $totalJobs = $query->count();
        $filledJobs = $query->where('project_jobs.accepted_candidates', '>=', 1)->count();
        $rate = $totalJobs > 0 ? round(($filledJobs / $totalJobs) * 100, 1) : 0;

        return $this->recruitmentMetric(
            'position_fill_rate',
            'Position Fill Rate',
            '(COUNT(project_jobs WHERE accepted_candidates >= 1) / COUNT(project_jobs)) × 100',
            'Share of job posts with at least one accepted candidate.',
            ['project_jobs.accepted_candidates', 'project_jobs.created_at'],
            [
                'unit' => '%',
                'value' => $rate,
                'filled_jobs' => $filledJobs,
                'total_jobs' => $totalJobs,
                'period' => $dateRange ? $dateRange['label'] : 'All time',
            ]
        );
    }

    /**
     * CORRIGÉ: la fonction originale était coupée en plein milieu du
     * selectRaw() — accolade jamais fermée, pas de return, le code
     * s'enchaînait directement sur withdrawalRate(). C'était une erreur de
     * syntaxe fatale qui cassait le parsing de tout le fichier.
     */
    private function applicationsByProfession(array $dateRange = null, ?string $search = null): array
    {
        $professionIdColumn = null;
        if ($this->safeHasColumns('project_jobs', ['professions_id'])) {
            $professionIdColumn = 'professions_id';
        } elseif ($this->safeHasColumns('project_jobs', ['profession_id'])) {
            $professionIdColumn = 'profession_id';
        }

        $professionNameColumn = null;
        if ($this->safeHasColumns('professions', ['name'])) {
            $professionNameColumn = 'name';
        } elseif ($this->safeHasColumns('professions', ['title'])) {
            $professionNameColumn = 'title';
        }

        if (! $this->safeHasColumns('applications', ['job_id', 'created_at']) || ! $professionIdColumn || ! $professionNameColumn) {
            return $this->recruitmentMetric(
                'applications_by_profession',
                'Applications by Profession',
                'GROUP BY profession name, COUNT(applications)',
                'Distribution of applications by profession role.',
                ['applications.job_id', 'applications.created_at', 'project_jobs.professions_id', 'professions.name or professions.title'],
                $this->blockedResponse('applications_by_profession', ['applications.job_id', 'applications.created_at', 'project_jobs.professions_id', 'professions.name or professions.title']),
                true
            );
        }

        $professionNameExpression = "professions.{$professionNameColumn}";

        $query = DB::table('applications as applications')
            ->join('project_jobs as project_jobs', 'applications.job_id', '=', 'project_jobs.id')
            ->join('professions as professions', "project_jobs.{$professionIdColumn}", '=', 'professions.id')
            ->join('users as users', 'applications.user_id', '=', 'users.id')
            ->selectRaw("{$professionNameExpression} as profession_name, COUNT(applications.id) as applications_count")
            ->groupBy($professionNameExpression);

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('applications.created_at', [$dateRange['start'], $dateRange['end']]);
        }

        if ($search) {
            $this->applyUserSearchFilter($query, $search);
            $like = '%' . $search . '%';
            $query->orWhere(DB::raw($professionNameExpression), 'like', $like);
        }

        $rows = $query->orderByDesc('applications_count')->get();

        return $this->recruitmentMetric(
            'applications_by_profession',
            'Applications by Profession',
            'GROUP BY profession name, COUNT(applications)',
            'Distribution of applications by profession role.',
            ['applications.job_id', 'applications.created_at', 'project_jobs.professions_id', 'professions.name or professions.title'],
            [
                'items' => $rows,
                'categories' => $rows->pluck('profession_name')->values(),
                'series' => [
                    [
                        'name' => 'Applications',
                        'data' => $rows->pluck('applications_count')->values(),
                    ],
                ],
                'period' => $dateRange ? $dateRange['label'] : 'All time',
            ]
        );
    }

    /**
     * CORRIGÉ: cette fonction était appelée avec $search dans
     * recruitmentApplicationsKpis() mais sa signature ne l'acceptait pas
     * -> le paramètre était silencieusement ignoré. Ajout du paramètre +
     * du filtre, comme pour les autres métriques du même groupe.
     */
    private function withdrawalRate(array $dateRange = null, ?string $search = null): array
    {
        if (! $this->safeHasColumns('applications', ['status', 'created_at'])) {
            return $this->recruitmentMetric(
                'withdrawal_rate',
                'Withdrawal Rate',
                '(withdrawn applications / total applications) × 100',
                'Share of applications withdrawn by candidates.',
                ['applications.status', 'applications.created_at'],
                $this->blockedResponse('withdrawal_rate', ['applications.status', 'applications.created_at']),
                true
            );
        }

        $query = DB::table('applications as applications')
            ->join('users as users', 'applications.user_id', '=', 'users.id');

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('applications.created_at', [$dateRange['start'], $dateRange['end']]);
        }

        $this->applyUserSearchFilter($query, $search);

        $totalApplications = $query->count();
        $withdrawnApplications = $query->where('applications.status', 'withdrawn')->count();
        $rate = $totalApplications > 0 ? round(($withdrawnApplications / $totalApplications) * 100, 1) : 0;

        return $this->recruitmentMetric(
            'withdrawal_rate',
            'Withdrawal Rate',
            '(withdrawn applications / total applications) × 100',
            'Share of applications withdrawn by candidates.',
            ['applications.status', 'applications.created_at'],
            [
                'unit' => '%',
                'value' => $rate,
                'withdrawn_applications' => $withdrawnApplications,
                'total_applications' => $totalApplications,
                'period' => $dateRange ? $dateRange['label'] : 'All time',
            ]
        );
    }

    public function profileCompletion()
    {
        // Colonnes purement techniques, jamais remplies "par" le candidat
        $excludedColumns = [
            'id', 'uuid', 'password', 'remember_token',
            'email_verified_at', 'created_at', 'updated_at',
        ];

        $allColumns = Schema::getColumnListing('users');
        $profileColumns = array_values(array_diff($allColumns, $excludedColumns));

        $total = User::count();

        $query = User::query();
        foreach ($profileColumns as $column) {
            $query->whereNotNull($column);

            // Le check "non vide" (!= '') n'a de sens que pour les colonnes texte
            // (pour les tinyint/booléens comme additional_info_done, ocr_verified,
            // 0 est une valeur valide et ne doit pas être traité comme "vide")
            $type = Schema::getColumnType('users', $column);
            if (in_array($type, ['string', 'text'])) {
                $query->where($column, '!=', '');
            }
        }

        // Jointure : le user doit avoir au moins une photo active dans gallery
        $query->whereExists(function ($sub) {
            $sub->selectRaw(1)
                ->from('gallery')
                ->whereColumn('gallery.user_id', 'users.id')
                ->where('gallery.is_active', 1);
        });

        $complete = $query->count();

        return response()->json([
            'total_users' => $total,
            'complete_profiles' => $complete,
            'completion_rate' => $total > 0 ? round(($complete / $total) * 100, 1) : 0,
            'checked_fields' => $profileColumns,
            'requires_active_gallery_image' => true,
        ]);
    }

    public function topJobOffers(Request $request)
    {
        $dateRange = $this->getDateRange($request);

        $query = DB::table('applications as applications')
            ->join('project_jobs as project_jobs', 'applications.job_id', '=', 'project_jobs.id')
            ->join('projects as projects', 'project_jobs.project_id', '=', 'projects.id')
            ->join('companies as companies', 'projects.company_id', '=', 'companies.id')
            ->selectRaw('
                projects.id as project_id,
                projects.title as job_title,
                companies.company_name as company_name,
                COUNT(applications.id) as applications_count
            ')
            ->groupBy('projects.id', 'projects.title', 'companies.company_name');

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('applications.created_at', [$dateRange['start'], $dateRange['end']]);
        }

        $topOffers = $query->orderByDesc('applications_count')
            ->limit(5)
            ->get();

        return response()->json([
            'items' => $topOffers,
            'labels' => $topOffers->map(function ($item) {
                return $item->job_title . ' / ' . $item->company_name;
            })->values(),
            'series' => [
                [
                    'name' => 'Applications',
                    'data' => $topOffers->pluck('applications_count')->values(),
                ],
            ],
            'period' => $dateRange ? $dateRange['label'] : 'All time',
        ]);
    }

    public function weeklyActiveUsers(Request $request)
    {
        $days = (int) $request->query('days', 7);
        $allowedDays = [7, 14, 28, 56];

        if (! in_array($days, $allowedDays, true)) {
            $days = 7;
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if ($startDate && $endDate) {
            $startOfPeriod = Carbon::parse($startDate)->startOfDay();
            $endOfPeriod = Carbon::parse($endDate)->endOfDay();
            $periodLabel = "{$startDate} to {$endDate}";

            $days = (int) $startOfPeriod->diffInDays($endOfPeriod) + 1;
        } else {
            $today = Carbon::today();
            $startOfPeriod = $today->copy()->subDays($days - 1)->startOfDay();
            $endOfPeriod = $today->copy()->endOfDay();
            $periodLabel = $days === 7 ? 'Last 7 days' : "Last {$days} days";
        }

        // CORRIGÉ: la même boucle était dupliquée 3 fois de suite dans le
        // code original (copier-coller non nettoyé) -> 3x plus de requêtes
        // SQL pour rien, avec un `if/else` qui faisait exactement la même
        // chose des deux côtés. Une seule boucle suffit.
        $dailyCounts = [];
        for ($offset = 0; $offset < $days; $offset++) {
            $day = $startOfPeriod->copy()->addDays($offset);

            $dailyCounts[] = User::query()
                ->whereNotNull('last_login')
                ->whereBetween('last_login', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
                ->count();
        }

        $activeUsers = array_sum($dailyCounts);

        return response()->json([
            'active_users' => $activeUsers,
            'period_days' => $days,
            'period_label' => $periodLabel,
            'categories' => collect(range(0, $days - 1))->map(function ($offset) use ($startOfPeriod) {
                return $startOfPeriod->copy()->addDays($offset)->format('d M');
            })->values(),
            'series' => [
                [
                    'name' => 'Weekly active users',
                    'data' => $dailyCounts,
                ],
            ],
        ]);
    }

    public function applicationsTrend(Request $request)
    {
        $days = max(7, (int) $request->query('days', 7));
        $days = in_array($days, [7, 14, 28, 30, 56], true) ? $days : 7;

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (! $this->safeHasColumns('applications', ['created_at'])) {
            return response()->json($this->blockedResponse('applications_trend', ['applications.created_at']));
        }

        if ($startDate && $endDate) {
            $startOfPeriod = Carbon::parse($startDate)->startOfDay();
            $endOfPeriod = Carbon::parse($endDate)->endOfDay();
            $periodLabel = "{$startDate} to {$endDate}";
        } else {
            [$startOfPeriod, $startOfPreviousPeriod, $endOfPreviousPeriod] = $this->trendWindow($days);
            $periodLabel = $this->formattedPeriodLabel($days);
        }

        $dailyCounts = collect(range(0, $days - 1))->map(function ($offset) use ($startOfPeriod) {
            $day = $startOfPeriod->copy()->addDays($offset);

            return DB::table('applications')
                ->whereBetween('created_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
                ->count();
        })->values();

        $currentCount = (int) $dailyCounts->sum();

        return response()->json([
            'metric' => 'applications_trend',
            'status' => 'ok',
            'current_count' => $currentCount,
            'period_days' => $days,
            'period_label' => $periodLabel,
            'categories' => collect(range(0, $days - 1))->map(function ($offset) use ($startOfPeriod) {
                return $startOfPeriod->copy()->addDays($offset)->format('d M');
            })->values(),
            'series' => [
                [
                    'name' => 'Applications',
                    'data' => $dailyCounts,
                ],
            ],
        ]);
    }

    public function projectsTrend(Request $request)
    {
        $days = max(30, (int) $request->query('days', 30));

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (! $this->safeHasColumns('projects', ['created_at'])) {
            return response()->json($this->blockedResponse('projects_trend', ['projects.created_at']));
        }

        if ($startDate && $endDate) {
            $startOfPeriod = Carbon::parse($startDate)->startOfDay();
            $endOfPeriod = Carbon::parse($endDate)->endOfDay();
            $periodLabel = "{$startDate} to {$endDate}";
            $days = $startOfPeriod->diffInDays($endOfPeriod) + 1;
        } else {
            $today = Carbon::today();
            $startOfPeriod = $today->copy()->subDays($days - 1)->startOfDay();
            $endOfPeriod = $today->copy()->endOfDay();
            $periodLabel = 'Current month';
        }

        $currentCount = (int) DB::table('projects')
            ->whereBetween('created_at', [$startOfPeriod, $endOfPeriod])
            ->count();

        $dailyCounts = collect(range(0, $days - 1))->map(function ($offset) use ($startOfPeriod) {
            $day = $startOfPeriod->copy()->addDays($offset);

            return DB::table('projects')
                ->whereBetween('created_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()])
                ->count();
        })->values();

        return response()->json([
            'metric' => 'projects_trend',
            'status' => 'ok',
            'current_count' => $currentCount,
            'period_days' => $days,
            'period_label' => $periodLabel,
            'categories' => collect(range(0, $days - 1))->map(function ($offset) use ($startOfPeriod) {
                return $startOfPeriod->copy()->addDays($offset)->format('d M');
            })->values(),
            'series' => [
                [
                    'name' => 'Projects',
                    'data' => $dailyCounts,
                ],
            ],
        ]);
    }

    public function overdueProjects(Request $request)
    {
        $dateRange = $this->getDateRange($request);

        if (! $this->safeHasColumns('projects', ['end_date', 'status'])) {
            return response()->json($this->blockedResponse('overdue_projects', ['projects.end_date', 'projects.status']));
        }

        $query = DB::table('projects')
            ->whereNotNull('end_date')
            ->where('end_date', '<', Carbon::today()->startOfDay())
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhere('status', '!=', 'completed');
            });

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('end_date', [$dateRange['start'], $dateRange['end']]);
        }

        $overdueProjects = $query->count();

        return response()->json([
            'metric' => 'overdue_projects',
            'status' => 'ok',
            'count' => $overdueProjects,
            'period_label' => $dateRange ? $dateRange['label'] : 'As of today',
            'required_fields' => ['projects.end_date', 'projects.status'],
        ]);
    }

    public function averageProjectDuration(Request $request)
    {
        $dateRange = $this->getDateRange($request);

        if (! $this->safeHasColumns('projects', ['start_date', 'completed_at'])) {
            return response()->json($this->blockedResponse('average_project_duration', ['projects.start_date', 'projects.completed_at']));
        }

        $query = DB::table('projects')
            ->whereNotNull('start_date')
            ->whereNotNull('completed_at');

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('completed_at', [$dateRange['start'], $dateRange['end']]);
        }

        $projectRows = $query->get(['start_date', 'completed_at']);

        $durations = $projectRows->map(function ($project) {
            return Carbon::parse($project->start_date)->diffInDays(Carbon::parse($project->completed_at));
        });

        $averageDays = $durations->isNotEmpty() ? round((float) $durations->avg(), 2) : 0;

        return response()->json([
            'metric' => 'average_project_duration',
            'status' => 'ok',
            'average_days' => $averageDays,
            'period' => $dateRange ? $dateRange['label'] : 'All completed projects',
            'required_fields' => ['projects.start_date', 'projects.completed_at'],
        ]);
    }

    public function overdueTasks(Request $request)
    {
        $dateRange = $this->getDateRange($request);

        if (! $this->safeHasColumns('tasks', ['due_date', 'status'])) {
            return response()->json($this->blockedResponse('overdue_tasks', ['tasks.due_date', 'tasks.status']));
        }

        $query = DB::table('tasks')
            ->whereNotNull('due_date')
            ->where('due_date', '<', Carbon::today()->startOfDay())
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhere('status', '!=', 'done');
            });

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('due_date', [$dateRange['start'], $dateRange['end']]);
        }

        $overdueTasks = $query->count();

        return response()->json([
            'metric' => 'overdue_tasks',
            'status' => 'ok',
            'count' => $overdueTasks,
            'period_label' => $dateRange ? $dateRange['label'] : 'As of today',
            'required_fields' => ['tasks.due_date', 'tasks.status'],
        ]);
    }

    public function applicationKpis(Request $request)
    {
        $dateRange = $this->getDateRange($request);

        if (! $this->safeHasColumns('applications', ['created_at'])) {
            return response()->json([
                'applications_trend' => $this->blockedResponse('applications_trend', ['applications.created_at']),
            ]);
        }

        $days = 7;
        $previousApplications = null;

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $currentApplications = DB::table('applications')
                ->whereBetween('created_at', [$dateRange['start'], $dateRange['end']])
                ->count();
        } else {
            $days = in_array((int) $request->query('days', 7), [7, 14, 28, 30, 56], true) ? (int) $request->query('days', 7) : 7;
            [$startOfPeriod, $startOfPreviousPeriod, $endOfPreviousPeriod] = $this->trendWindow($days);

            $currentApplications = DB::table('applications')
                ->whereBetween('created_at', [$startOfPeriod, Carbon::today()->endOfDay()])
                ->count();

            $previousApplications = DB::table('applications')
                ->whereBetween('created_at', [$startOfPreviousPeriod, $endOfPreviousPeriod])
                ->count();
        }

        $growthRate = 0;
        if ($previousApplications !== null) {
            $growthRate = $previousApplications > 0
                ? round((($currentApplications - $previousApplications) / $previousApplications) * 100, 1)
                : ($currentApplications > 0 ? 100 : 0);
        }

        return response()->json([
            'metric' => 'new_applications_comparison',
            'status' => 'ok',
            'current_count' => $currentApplications,
            'previous_count' => $previousApplications ?? 0,
            'growth_rate' => $growthRate,
            'period_days' => $dateRange && $dateRange['isCustom'] ? null : $days,
            'period_label' => $dateRange ? $dateRange['label'] : $this->formattedPeriodLabel($days),
            'required_fields' => ['applications.created_at'],
        ]);
    }

    public function nationalityBreakdown(Request $request)
    {
        $dateRange = $this->getDateRange($request);

        $query = User::query()
            ->selectRaw('COALESCE(NULLIF(TRIM(nationality), ""), "Unknown") as nationality, COUNT(*) as people_count')
            ->groupBy('nationality');

        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
        }

        $nationalityRows = $query->orderByDesc('people_count')->get();

        $topRows = $nationalityRows->take(8)->values();
        $otherCount = $nationalityRows->slice(8)->sum('people_count');

        $items = $topRows->map(function ($row) {
            return [
                'nationality' => $row->nationality,
                'people_count' => (int) $row->people_count,
            ];
        });

        if ($otherCount > 0) {
            $items->push([
                'nationality' => 'Other',
                'people_count' => (int) $otherCount,
            ]);
        }

        $totalUsers = User::count();
        if ($dateRange && $dateRange['isCustom'] && $dateRange['start'] && $dateRange['end']) {
            $totalUsers = User::whereBetween('created_at', [$dateRange['start'], $dateRange['end']])->count();
        }

        return response()->json([
            'items' => $items->values(),
            'categories' => $items->pluck('nationality')->values(),
            'series' => [
                [
                    'name' => 'Number of people',
                    'data' => $items->pluck('people_count')->values(),
                ],
            ],
            'total_users' => $totalUsers,
            'period' => $dateRange ? $dateRange['label'] : 'All time',
        ]);
    }

    public function activeWorkers(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (! $this->safeHasColumns('attendances', ['user_id', 'check_in_time'])) {
            return response()->json([
                'metric_name' => 'Active Workers',
                'status' => 'blocked',
                'required_fields' => ['attendances.user_id', 'attendances.check_in_time'],
            ]);
        }

        $query = DB::table('attendances')
            ->whereNotNull('check_in_time')
            ->selectRaw('COUNT(DISTINCT user_id) as active_workers');

        if ($startDate && $endDate) {
            $query->whereBetween('check_in_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $periodLabel = "{$startDate} to {$endDate}";
        } else {
            $periodLabel = 'All time';
        }

        $activeWorkers = (int) $query->value('active_workers');

        return response()->json([
            'metric_name' => 'Active Workers',
            'active_workers' => $activeWorkers,
            'period' => $periodLabel,
            'unit' => 'workers',
            'vs_previous_period' => null,
            'status' => 'normal',
        ]);
    }

    public function totalHoursWorked(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (! $this->safeHasColumns('attendances', ['total_hours', 'check_in_time', 'check_out_time', 'user_id'])) {
            return response()->json([
                'metric_name' => 'Total Hours Worked',
                'status' => 'blocked',
                'required_fields' => ['attendances.total_hours', 'attendances.check_in_time', 'attendances.check_out_time', 'attendances.user_id'],
            ]);
        }

        $query = DB::table('attendances')
            ->whereNotNull('check_out_time')
            ->selectRaw('
                SUM(total_hours) as total_hours,
                COUNT(DISTINCT user_id) as unique_workers,
                COUNT(*) as completed_shifts,
                AVG(total_hours) as average_hours_per_shift
            ');

        if ($startDate && $endDate) {
            $query->whereBetween('check_in_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $periodLabel = "{$startDate} to {$endDate}";
        } else {
            $periodLabel = 'All time';
        }

        $result = $query->first();

        $totalHours = (float) ($result->total_hours ?? 0);
        $completedShifts = (int) ($result->completed_shifts ?? 0);
        $uniqueWorkers = (int) ($result->unique_workers ?? 0);
        $avgPerShift = $completedShifts > 0 ? round($totalHours / $completedShifts, 2) : 0;
        $avgPerWorker = $uniqueWorkers > 0 ? round($totalHours / $uniqueWorkers, 2) : 0;

        $status = $totalHours < 50 ? 'low' : ($totalHours < 200 ? 'normal' : 'high');

        return response()->json([
            'metric_name' => 'Total Hours Worked',
            'total_hours' => round($totalHours, 2),
            'unit' => 'hours',
            'completed_shifts' => $completedShifts,
            'unique_workers_contributed' => $uniqueWorkers,
            'average_per_shift' => $avgPerShift,
            'average_per_worker' => $avgPerWorker,
            'period' => $periodLabel,
            'status' => $status,
        ]);
    }

    public function absenteeismRate(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (! $this->safeHasColumns('attendances', ['status', 'check_in_time'])) {
            return response()->json([
                'metric_name' => 'Absenteeism / Late Arrival Rate',
                'status' => 'blocked',
                'required_fields' => ['attendances.status', 'attendances.check_in_time'],
            ]);
        }

        $query = DB::table('attendances')
            ->whereNotNull('check_in_time')
            ->selectRaw('
                COUNT(*) as total_attendance_records,
                SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as on_time,
                SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late_arrivals,
                ROUND((SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as late_rate
            ');

        if ($startDate && $endDate) {
            $query->whereBetween('check_in_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $periodLabel = "{$startDate} to {$endDate}";
        } else {
            $periodLabel = 'All time';
        }

        $result = $query->first();

        $totalRecords = (int) ($result->total_attendance_records ?? 0);
        $onTime = (int) ($result->on_time ?? 0);
        $lateArrivals = (int) ($result->late_arrivals ?? 0);
        $lateRate = (float) ($result->late_rate ?? 0);

        $status = 'low';
        $concernLevel = '';

        if ($lateRate > 50) {
            $status = 'critical';
            $concernLevel = '⚠️ More than 50% of workers arriving late';
        } elseif ($lateRate > 30) {
            $status = 'high';
            $concernLevel = '⚠️ High late arrival rate';
        } elseif ($lateRate > 10) {
            $status = 'normal';
        } else {
            $status = 'low';
        }

        return response()->json([
            'metric_name' => 'Absenteeism / Late Arrival Rate',
            'total_attendance_records' => $totalRecords,
            'present_on_time' => $onTime,
            'late_arrivals' => $lateArrivals,
            'late_rate' => $lateRate,
            'unit' => '%',
            'period' => $periodLabel,
            'status' => $status,
            'concern_level' => $concernLevel,
        ]);
    }

    public function workerRetentionRate(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (! $this->safeHasColumns('attendances', ['user_id', 'check_in_time'])) {
            return response()->json([
                'metric_name' => 'Worker Retention Rate',
                'status' => 'blocked',
                'required_fields' => ['attendances.user_id', 'attendances.check_in_time'],
            ]);
        }

        $query = DB::table('attendances')
            ->whereNotNull('check_in_time')
            ->selectRaw('user_id, COUNT(*) as shift_count')
            ->groupBy('user_id');

        if ($startDate && $endDate) {
            $query->whereBetween('check_in_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $periodLabel = "{$startDate} to {$endDate}";
        } else {
            $periodLabel = 'All time';
        }

        $workerShifts = $query->get();

        $totalUniqueWorkers = $workerShifts->count();
        $retainedWorkers = $workerShifts->where('shift_count', '>=', 2)->count();
        $singleShiftOnly = $totalUniqueWorkers - $retainedWorkers;

        $retentionRate = $totalUniqueWorkers > 0 ? round(($retainedWorkers / $totalUniqueWorkers) * 100, 1) : 0;

        $status = 'poor';
        $interpretation = '';

        if ($retentionRate > 85) {
            $status = 'excellent';
            $interpretation = "Strong workforce loyalty - {$retentionRate}% of workers return for multiple shifts";
        } elseif ($retentionRate >= 70) {
            $status = 'good';
            $interpretation = "Good retention - {$retentionRate}% of workers return for multiple shifts";
        } elseif ($retentionRate >= 50) {
            $status = 'normal';
            $interpretation = "Moderate retention - {$retentionRate}% of workers return for multiple shifts";
        } else {
            $status = 'poor';
            $interpretation = "Low retention - only {$retentionRate}% of workers return for multiple shifts";
        }

        return response()->json([
            'metric_name' => 'Worker Retention Rate',
            'total_unique_workers' => $totalUniqueWorkers,
            'retained_workers' => $retainedWorkers,
            'single_shift_only' => $singleShiftOnly,
            'retention_rate' => $retentionRate,
            'unit' => '%',
            'period' => $periodLabel,
            'status' => $status,
            'interpretation' => $interpretation,
        ]);
    }

    public function debugFinancialTables()
    {
        $tables = ['projects', 'project_jobs', 'budgets', 'wallet_transactions'];
        $result = [];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $columns = Schema::getColumnListing($table);
                $columnTypes = [];
                foreach ($columns as $column) {
                    $columnTypes[$column] = Schema::getColumnType($table, $column);
                }
                $count = DB::table($table)->count();
                $sample = DB::table($table)->limit(3)->get();

                $result[$table] = [
                    'exists' => true,
                    'count' => $count,
                    'columns' => $columns,
                    'column_types' => $columnTypes,
                    'sample' => $sample,
                ];
            } else {
                $result[$table] = ['exists' => false];
            }
        }

        return response()->json($result);
    }

    public function debugPerformanceTables()
    {
        $tables = ['projects', 'todos', 'tasks', 'user_ratings', 'ratings'];
        $result = [];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $columns = Schema::getColumnListing($table);
                $columnTypes = [];
                foreach ($columns as $column) {
                    $columnTypes[$column] = Schema::getColumnType($table, $column);
                }
                $count = DB::table($table)->count();
                $sample = DB::table($table)->limit(3)->get();

                $result[$table] = [
                    'exists' => true,
                    'count' => $count,
                    'columns' => $columns,
                    'column_types' => $columnTypes,
                    'sample' => $sample,
                ];
            } else {
                $result[$table] = ['exists' => false];
            }
        }

        return response()->json($result);
    }

    public function debugUsersTable()
    {
        if (! Schema::hasTable('users')) {
            return response()->json(['error' => 'Table users does not exist']);
        }

        $columns = Schema::getColumnListing('users');
        $columnTypes = [];
        foreach ($columns as $column) {
            $columnTypes[$column] = Schema::getColumnType('users', $column);
        }

        $sample = DB::table('users')->limit(3)->get();

        return response()->json([
            'exists' => true,
            'columns' => $columns,
            'column_types' => $columnTypes,
            'sample' => $sample,
        ]);
    }

    public function averageCostPerFilledPosition()
    {
        if (! $this->safeHasColumns('projects', ['total_cost']) || ! $this->safeHasColumns('project_jobs', ['accepted_candidates'])) {
            return response()->json([
                'metric_name' => 'Average Cost per Filled Position',
                'status' => 'blocked',
                'required_fields' => ['projects.total_cost', 'project_jobs.accepted_candidates'],
            ]);
        }

        $totalCost = DB::table('projects')->sum('total_cost');
        $filledPositions = DB::table('project_jobs')->where('accepted_candidates', '>', 0)->count();
        $averageCost = $filledPositions > 0 ? round($totalCost / $filledPositions, 2) : 0;

        return response()->json([
            'metric_name' => 'Average Cost per Filled Position',
            'total_cost' => $totalCost,
            'filled_positions' => $filledPositions,
            'average_cost' => $averageCost,
            'unit' => 'currency',
            'period' => 'All time',
            'status' => 'normal',
        ]);
    }

    public function averageCostPerProject(Request $request)
    {
        $statusFilter = $request->query('status');

        if (! $this->safeHasColumns('projects', ['total_cost'])) {
            return response()->json([
                'metric_name' => 'Average Cost per Project',
                'status' => 'blocked',
                'required_fields' => ['projects.total_cost'],
            ]);
        }

        $query = DB::table('projects');

        if ($statusFilter) {
            $query->where('status', $statusFilter);
            $periodLabel = "Status: {$statusFilter}";
        } else {
            $periodLabel = 'All projects';
        }

        $totalCost = $query->sum('total_cost');
        $projectCount = $query->count();
        $averageCost = $projectCount > 0 ? round($totalCost / $projectCount, 2) : 0;

        return response()->json([
            'metric_name' => 'Average Cost per Project',
            'total_cost' => $totalCost,
            'project_count' => $projectCount,
            'average_cost' => $averageCost,
            'unit' => 'currency',
            'period' => $periodLabel,
            'status' => 'normal',
        ]);
    }

    public function monthlyCostTrend(Request $request)
    {
        $months = max(12, (int) $request->query('months', 12));

        if (! $this->safeHasColumns('projects', ['total_cost', 'created_at'])) {
            return response()->json([
                'metric_name' => 'Monthly Cost Trend',
                'status' => 'blocked',
                'required_fields' => ['projects.total_cost', 'projects.created_at'],
            ]);
        }

        $today = Carbon::today();
        $startDate = $today->copy()->subMonths($months - 1)->startOfMonth();

        $monthlyData = collect(range(0, $months - 1))->map(function ($offset) use ($startDate) {
            $monthStart = $startDate->copy()->addMonths($offset)->startOfMonth();
            $monthEnd = $monthStart->copy()->endOfMonth();

            $cost = DB::table('projects')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('total_cost');

            return [
                'month' => $monthStart->format('M Y'),
                'cost' => (float) $cost,
            ];
        })->values();

        $currentYearCost = $monthlyData->sum('cost');

        return response()->json([
            'metric_name' => 'Monthly Cost Trend',
            'period_months' => $months,
            'period_label' => 'Last ' . $months . ' months',
            'total_cost' => $currentYearCost,
            'monthly_data' => $monthlyData,
            'categories' => $monthlyData->pluck('month')->values(),
            'series' => [
                [
                    'name' => 'Cost',
                    'data' => $monthlyData->pluck('cost')->values(),
                ],
            ],
            'status' => 'normal',
        ]);
    }

    public function remainingBudget()
    {
        if (! $this->safeHasColumns('projects', ['total_cost'])) {
            return response()->json([
                'metric_name' => 'Remaining Budget',
                'status' => 'blocked',
                'required_fields' => ['projects.total_cost'],
            ]);
        }

        $totalBudget = 500000;
        $totalSpent = DB::table('projects')->sum('total_cost');
        $remainingBudget = $totalBudget - $totalSpent;
        $spentPercentage = $totalBudget > 0 ? round(($totalSpent / $totalBudget) * 100, 1) : 0;

        return response()->json([
            'metric_name' => 'Remaining Budget',
            'total_budget' => $totalBudget,
            'total_spent' => $totalSpent,
            'remaining_budget' => $remainingBudget,
            'spent_percentage' => $spentPercentage,
            'unit' => 'currency',
            'period' => 'All time',
            'status' => $remainingBudget > 0 ? 'normal' : 'critical',
        ]);
    }

    public function performanceProductivityKpis()
    {
        $metrics = [
            $this->overdueProjectsPerformance(),
            $this->averageProjectDurationPerformance(),
            $this->overdueTasksPerformance(),
            $this->averageWorkerRating(),
        ];

        return response()->json([
            'group' => 'performance_productivity',
            'status' => 'ok',
            'items' => $metrics,
        ]);
    }

    public function overdueProjectsPerformance()
    {
        if (! $this->safeHasColumns('projects', ['end_date', 'status'])) {
            return response()->json([
                'metric_name' => 'Overdue Projects',
                'status' => 'blocked',
                'required_fields' => ['projects.end_date', 'projects.status'],
            ]);
        }

        $overdueProjects = DB::table('projects')
            ->whereNotNull('end_date')
            ->where('end_date', '<', Carbon::today()->startOfDay())
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', ['completed', 'closed']);
            })
            ->count();

        $totalActiveProjects = DB::table('projects')
            ->whereNotIn('status', ['completed', 'closed'])
            ->count();

        $overdueRate = $totalActiveProjects > 0 ? round(($overdueProjects / $totalActiveProjects) * 100, 1) : 0;

        $status = 'low';
        if ($overdueRate > 50) {
            $status = 'critical';
        } elseif ($overdueRate > 30) {
            $status = 'high';
        } elseif ($overdueRate > 10) {
            $status = 'normal';
        }

        return response()->json([
            'metric_name' => 'Overdue Projects',
            'overdue_count' => $overdueProjects,
            'total_active_projects' => $totalActiveProjects,
            'overdue_rate' => $overdueRate,
            'unit' => 'projects',
            'period' => 'As of today',
            'status' => $status,
        ]);
    }

    public function averageProjectDurationPerformance()
    {
        if (! $this->safeHasColumns('projects', ['start_date', 'end_date', 'status'])) {
            return response()->json([
                'metric_name' => 'Average Project Duration',
                'status' => 'blocked',
                'required_fields' => ['projects.start_date', 'projects.end_date', 'projects.status'],
            ]);
        }

        $completedProjects = DB::table('projects')
            ->where('status', 'completed')
            ->whereNotNull('start_date')
            ->whereNotNull('end_date')
            ->get(['start_date', 'end_date']);

        $durations = $completedProjects->map(function ($project) {
            return Carbon::parse($project->start_date)->diffInDays(Carbon::parse($project->end_date));
        });

        $averageDuration = $durations->isNotEmpty() ? round($durations->avg(), 1) : 0;

        return response()->json([
            'metric_name' => 'Average Project Duration',
            'average_days' => $averageDuration,
            'completed_projects_count' => $completedProjects->count(),
            'unit' => 'days',
            'period' => 'All completed projects',
            'status' => 'normal',
        ]);
    }

    public function overdueTasksPerformance()
    {
        $tasksTable = Schema::hasTable('todos') ? 'todos' : (Schema::hasTable('tasks') ? 'tasks' : null);

        if (! $tasksTable || ! $this->safeHasColumns($tasksTable, ['due_date', 'status'])) {
            return response()->json([
                'metric_name' => 'Overdue Tasks',
                'status' => 'blocked',
                'required_fields' => ['todos.due_date', 'todos.status'],
            ]);
        }

        $overdueTasks = DB::table($tasksTable)
            ->whereNotNull('due_date')
            ->where('due_date', '<', Carbon::today()->startOfDay())
            ->where(function ($query) use ($tasksTable) {
                $query->whereNull('status')
                    ->orWhereNotIn('status', ['done', 'completed']);
            })
            ->count();

        $totalPendingTasks = DB::table($tasksTable)
            ->whereNotIn('status', ['done', 'completed'])
            ->count();

        $overdueRate = $totalPendingTasks > 0 ? round(($overdueTasks / $totalPendingTasks) * 100, 1) : 0;

        $status = 'low';
        if ($overdueRate > 50) {
            $status = 'critical';
        } elseif ($overdueRate > 30) {
            $status = 'high';
        } elseif ($overdueRate > 10) {
            $status = 'normal';
        }

        return response()->json([
            'metric_name' => 'Overdue Tasks',
            'overdue_count' => $overdueTasks,
            'total_pending_tasks' => $totalPendingTasks,
            'overdue_rate' => $overdueRate,
            'unit' => 'tasks',
            'period' => 'As of today',
            'status' => $status,
        ]);
    }

    public function averageWorkerRating()
    {
        $ratingsTable = Schema::hasTable('user_ratings') ? 'user_ratings' : (Schema::hasTable('ratings') ? 'ratings' : null);

        if (! $ratingsTable || ! $this->safeHasColumns($ratingsTable, ['rating', 'user_id'])) {
            return response()->json([
                'metric_name' => 'Average Worker Rating',
                'status' => 'blocked',
                'required_fields' => ['user_ratings.rating', 'user_ratings.user_id'],
            ]);
        }

        $averageRating = DB::table($ratingsTable)
            ->whereNotNull('rating')
            ->avg('rating');

        $totalRatings = DB::table($ratingsTable)
            ->whereNotNull('rating')
            ->count();

        $ratedWorkers = DB::table($ratingsTable)
            ->whereNotNull('rating')
            ->distinct('user_id')
            ->count('user_id');

        $averageRating = $averageRating ? round((float) $averageRating, 2) : 0;

        $status = 'poor';
        if ($averageRating >= 4.0) {
            $status = 'excellent';
        } elseif ($averageRating >= 3.0) {
            $status = 'good';
        } elseif ($averageRating >= 2.0) {
            $status = 'normal';
        }

        return response()->json([
            'metric_name' => 'Average Worker Rating',
            'average_rating' => $averageRating,
            'total_ratings' => $totalRatings,
            'rated_workers' => $ratedWorkers,
            'unit' => 'stars',
            'period' => 'All time',
            'status' => $status,
        ]);
    }

    public function trendsKpis()
    {
        $metrics = [
            $this->newApplicationsTrend(),
            $this->projectsCreatedTrend(),
            $this->penaltiesIssued(),
        ];

        return response()->json([
            'group' => 'trends',
            'status' => 'ok',
            'items' => $metrics,
        ]);
    }

    public function newApplicationsTrend()
    {
        if (! $this->safeHasColumns('applications', ['created_at'])) {
            return response()->json([
                'metric_name' => 'New Applications Trend',
                'status' => 'blocked',
                'required_fields' => ['applications.created_at'],
            ]);
        }

        $today = Carbon::today();
        $thisWeekStart = $today->copy()->subDays(6)->startOfDay();
        $thisWeekEnd = $today->copy()->endOfDay();
        $lastWeekStart = $today->copy()->subDays(13)->startOfDay();
        $lastWeekEnd = $today->copy()->subDays(7)->endOfDay();

        $thisWeekCount = DB::table('applications')
            ->whereBetween('created_at', [$thisWeekStart, $thisWeekEnd])
            ->count();

        $lastWeekCount = DB::table('applications')
            ->whereBetween('created_at', [$lastWeekStart, $lastWeekEnd])
            ->count();

        $growthRate = $lastWeekCount > 0 ? round((($thisWeekCount - $lastWeekCount) / $lastWeekCount) * 100, 1) : ($thisWeekCount > 0 ? 100 : 0);

        $status = 'low';
        if ($growthRate > 50) {
            $status = 'excellent';
        } elseif ($growthRate > 20) {
            $status = 'good';
        } elseif ($growthRate > -20) {
            $status = 'normal';
        } elseif ($growthRate > -50) {
            $status = 'low';
        } else {
            $status = 'critical';
        }

        return response()->json([
            'metric_name' => 'New Applications Trend',
            'this_week_count' => $thisWeekCount,
            'last_week_count' => $lastWeekCount,
            'growth_rate' => $growthRate,
            'unit' => 'applications',
            'period' => 'This week vs last week',
            'status' => $status,
        ]);
    }

    public function projectsCreatedTrend()
    {
        if (! $this->safeHasColumns('projects', ['created_at'])) {
            return response()->json([
                'metric_name' => 'Projects Created Trend',
                'status' => 'blocked',
                'required_fields' => ['projects.created_at'],
            ]);
        }

        $today = Carbon::today();
        $thisMonthStart = $today->copy()->startOfMonth()->startOfDay();
        $thisMonthEnd = $today->copy()->endOfDay();
        $lastMonthStart = $today->copy()->subMonthNoOverflow()->startOfMonth()->startOfDay();
        $lastMonthEnd = $today->copy()->subMonthNoOverflow()->endOfMonth()->endOfDay();

        $thisMonthCount = DB::table('projects')
            ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
            ->count();

        $lastMonthCount = DB::table('projects')
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        $growthRate = $lastMonthCount > 0 ? round((($thisMonthCount - $lastMonthCount) / $lastMonthCount) * 100, 1) : ($thisMonthCount > 0 ? 100 : 0);

        $status = 'low';
        if ($growthRate > 50) {
            $status = 'excellent';
        } elseif ($growthRate > 20) {
            $status = 'good';
        } elseif ($growthRate > -20) {
            $status = 'normal';
        } elseif ($growthRate > -50) {
            $status = 'low';
        } else {
            $status = 'critical';
        }

        return response()->json([
            'metric_name' => 'Projects Created Trend',
            'this_month_count' => $thisMonthCount,
            'last_month_count' => $lastMonthCount,
            'growth_rate' => $growthRate,
            'unit' => 'projects',
            'period' => 'This month vs last month',
            'status' => $status,
        ]);
    }

    public function penaltiesIssued()
    {
        $penaltiesTable = Schema::hasTable('penalties') ? 'penalties' : (Schema::hasTable('user_penalties') ? 'user_penalties' : null);

        if (! $penaltiesTable || ! $this->safeHasColumns($penaltiesTable, ['wallet_amount'])) {
            return response()->json([
                'metric_name' => 'Penalties Issued',
                'status' => 'blocked',
                'required_fields' => ['penalties.wallet_amount'],
            ]);
        }

        $totalPenalties = DB::table($penaltiesTable)->count();
        $totalAmount = DB::table($penaltiesTable)->sum('wallet_amount');
        $totalAmount = $totalAmount ? (float) $totalAmount : 0;

        $thisMonthPenalties = DB::table($penaltiesTable)
            ->whereBetween('created_at', [Carbon::today()->startOfMonth(), Carbon::today()->endOfDay()])
            ->count();

        $status = 'low';
        if ($totalPenalties === 0) {
            $status = 'excellent';
        } elseif ($totalPenalties < 5) {
            $status = 'good';
        } elseif ($totalPenalties < 20) {
            $status = 'normal';
        } else {
            $status = 'critical';
        }

        return response()->json([
            'metric_name' => 'Penalties Issued',
            'total_penalties' => $totalPenalties,
            'total_amount' => $totalAmount,
            'this_month_penalties' => $thisMonthPenalties,
            'unit' => 'penalties',
            'period' => 'All time',
            'status' => $status,
        ]);
    }
}
