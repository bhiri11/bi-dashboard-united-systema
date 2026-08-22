<?php

use App\Http\Controllers\KpiCandidatsController;
use Illuminate\Support\Facades\Route;

Route::get('/kpi/profile-completion', [KpiCandidatsController::class, 'profileCompletion']);
Route::get('/kpi/top-job-offers', [KpiCandidatsController::class, 'topJobOffers']);
Route::get('/kpi/weekly-active-users', [KpiCandidatsController::class, 'weeklyActiveUsers']);
Route::get('/kpi/nationality-breakdown', [KpiCandidatsController::class, 'nationalityBreakdown']);
Route::get('/kpi/recruitment-applications', [KpiCandidatsController::class, 'recruitmentApplicationsKpis']);
Route::get('/kpi/applications-trend', [KpiCandidatsController::class, 'applicationsTrend']);
Route::get('/kpi/projects-trend', [KpiCandidatsController::class, 'projectsTrend']);
Route::get('/kpi/overdue-projects', [KpiCandidatsController::class, 'overdueProjects']);
Route::get('/kpi/average-project-duration', [KpiCandidatsController::class, 'averageProjectDuration']);
Route::get('/kpi/overdue-tasks', [KpiCandidatsController::class, 'overdueTasks']);
Route::get('/kpi/new-applications', [KpiCandidatsController::class, 'applicationKpis']);
Route::get('/kpi/workforce/active-workers', [KpiCandidatsController::class, 'activeWorkers']);
Route::get('/kpi/workforce/total-hours-worked', [KpiCandidatsController::class, 'totalHoursWorked']);
Route::get('/kpi/workforce/absenteeism-rate', [KpiCandidatsController::class, 'absenteeismRate']);
Route::get('/kpi/workforce/retention-rate', [KpiCandidatsController::class, 'workerRetentionRate']);
Route::get('/kpi/financial/average-cost-per-filled-position', [KpiCandidatsController::class, 'averageCostPerFilledPosition']);
Route::get('/kpi/financial/average-cost-per-project', [KpiCandidatsController::class, 'averageCostPerProject']);
Route::get('/kpi/financial/monthly-cost-trend', [KpiCandidatsController::class, 'monthlyCostTrend']);
Route::get('/kpi/financial/remaining-budget', [KpiCandidatsController::class, 'remainingBudget']);
Route::get('/kpi/performance/overdue-projects', [KpiCandidatsController::class, 'overdueProjectsPerformance']);
Route::get('/kpi/performance/average-project-duration', [KpiCandidatsController::class, 'averageProjectDurationPerformance']);
Route::get('/kpi/performance/overdue-tasks', [KpiCandidatsController::class, 'overdueTasksPerformance']);
Route::get('/kpi/performance/average-worker-rating', [KpiCandidatsController::class, 'averageWorkerRating']);
Route::get('/kpi/trends/new-applications', [KpiCandidatsController::class, 'newApplicationsTrend']);
Route::get('/kpi/trends/projects-created', [KpiCandidatsController::class, 'projectsCreatedTrend']);
Route::get('/kpi/trends/penalties-issued', [KpiCandidatsController::class, 'penaltiesIssued']);
Route::get('/kpi/debug/users-table', [KpiCandidatsController::class, 'debugUsersTable']);
