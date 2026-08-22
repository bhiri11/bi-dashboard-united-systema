<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Tests\TestCase;

class PhaseOneKpisTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->timestamp('created_at')->nullable();
            $table->string('status')->nullable();
            $table->string('profession')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('status')->nullable();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->date('due_date')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
    }

    public function test_phase_one_kpis_are_computed_from_existing_fields(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-06 12:00:00'));

        $this->insertRows();

        $applicationsTrend = $this->getJson('/api/kpi/applications-trend?days=7');
        $applicationsTrend
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('current_count', 3)
            ->assertJsonPath('previous_count', 2)
            ->assertJsonCount(7, 'categories')
            ->assertJsonCount(7, 'series.0.data');

        $projectsTrend = $this->getJson('/api/kpi/projects-trend');
        $projectsTrend
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('current_count', 2)
            ->assertJsonPath('previous_count', 1)
            ->assertJsonPath('growth_rate', 100)
            ->assertJsonCount(30, 'categories');

        $overdueProjects = $this->getJson('/api/kpi/overdue-projects');
        $overdueProjects
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('count', 1);

        $averageProjectDuration = $this->getJson('/api/kpi/average-project-duration');
        $averageProjectDuration
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('average_days', 4);

        $overdueTasks = $this->getJson('/api/kpi/overdue-tasks');
        $overdueTasks
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('count', 1);
    }

    private function insertRows(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-06 12:00:00'));

        DB::table('applications')->insert([
            ['created_at' => '2026-08-06 10:00:00', 'updated_at' => '2026-08-06 10:00:00', 'status' => 'pending', 'profession' => 'Model'],
            ['created_at' => '2026-08-05 10:00:00', 'updated_at' => '2026-08-05 10:00:00', 'status' => 'accepted', 'profession' => 'Model'],
            ['created_at' => '2026-08-01 10:00:00', 'updated_at' => '2026-08-01 10:00:00', 'status' => 'withdrawn', 'profession' => 'Host'],
            ['created_at' => '2026-07-30 10:00:00', 'updated_at' => '2026-07-30 10:00:00', 'status' => 'accepted', 'profession' => 'Host'],
            ['created_at' => '2026-07-25 10:00:00', 'updated_at' => '2026-07-25 10:00:00', 'status' => 'pending', 'profession' => 'Model'],
        ]);

        DB::table('projects')->insert([
            ['created_at' => '2026-08-04 10:00:00', 'updated_at' => '2026-08-04 10:00:00', 'start_date' => '2026-08-01', 'end_date' => '2026-08-05', 'completed_at' => '2026-08-05 00:00:00', 'status' => 'completed'],
            ['created_at' => '2026-08-05 10:00:00', 'updated_at' => '2026-08-05 10:00:00', 'start_date' => '2026-08-02', 'end_date' => '2026-08-08', 'completed_at' => '2026-08-06 00:00:00', 'status' => 'in_progress'],
            ['created_at' => '2026-07-20 10:00:00', 'updated_at' => '2026-07-20 10:00:00', 'start_date' => '2026-07-10', 'end_date' => '2026-07-15', 'completed_at' => '2026-07-14 00:00:00', 'status' => 'in_progress'],
        ]);

        DB::table('tasks')->insert([
            ['due_date' => '2026-08-01', 'status' => 'todo', 'created_at' => '2026-07-20 10:00:00', 'updated_at' => '2026-07-20 10:00:00'],
            ['due_date' => '2026-08-02', 'status' => 'done', 'created_at' => '2026-07-20 10:00:00', 'updated_at' => '2026-07-20 10:00:00'],
            ['due_date' => '2026-08-10', 'status' => 'todo', 'created_at' => '2026-07-20 10:00:00', 'updated_at' => '2026-07-20 10:00:00'],
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }
}
